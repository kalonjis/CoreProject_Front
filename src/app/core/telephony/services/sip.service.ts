import { Injectable, OnDestroy, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Inviter,
  Registerer,
  RegistererState,
  SessionState,
  UserAgent,
  UserAgentOptions
} from 'sip.js';
import { FeedbackService } from '../../../shared/feedback/tools/feedback.service';
import { CallApiService } from './call-api.service';
import { CallStore } from '../state/call.store';

/**
 * Wraps SIP.js to manage the full WebRTC/SIP lifecycle for the CRM.
 *
 * Lifecycle:
 *  1. {@link initialize} — called once by CrmShellComponent on load.
 *     Fetches SIP credentials, creates the UserAgent, registers on Asterisk.
 *     Silently no-ops if no SIP config is assigned to the user.
 *  2. {@link call} — creates an Inviter for an outbound call.
 *     SIP events drive store updates and backend PATCH calls automatically.
 *  3. {@link hangup} — sends BYE; the Terminated event handles the rest.
 *  4. {@link toggleMute} — enables/disables the audio track on the RTCPeerConnection.
 */
@Injectable({ providedIn: 'root' })
export class SipService implements OnDestroy {

  private readonly api      = inject(CallApiService);
  private readonly store    = inject(CallStore);
  private readonly feedback = inject(FeedbackService);

  private ua: UserAgent | null          = null;
  private registerer: Registerer | null = null;
  private session: Inviter | null       = null;

  /** Public ID of the current CRM session (set right after POST /initiate). */
  private sessionPublicId: string | null = null;

  /** Whether the call was answered (used to pick ENDED vs MISSED on termination). */
  private wasAnswered = false;

  // =========================================================================
  // Selectors (passthrough from store)
  // =========================================================================

  readonly isRegistered = this.store.isSipReady;

  // =========================================================================
  // Lifecycle
  // =========================================================================

  /**
   * Fetches SIP credentials and registers the UserAgent against Asterisk.
   * Called once when the CRM shell loads. Silently exits if no SIP config exists.
   */
  async initialize(): Promise<void> {
    if (this.ua) return;  // already initialized — prevent double-registration on re-render
    try {
      const creds = await firstValueFrom(this.api.getSipConnectionDetails());
      if (!creds?.wsUrl) return;

      this.store.setSipHasConfig(true);
      this.store.setSipStatus('REGISTERING');

      const options: UserAgentOptions = {
        uri: UserAgent.makeURI(`sip:${creds.sipUsername}@${creds.sipDomain}`)!,
        transportOptions: { server: creds.wsUrl },
        authorizationUsername: creds.sipUsername,
        authorizationPassword: creds.sipPassword,
        displayName: creds.displayName ?? creds.sipUsername,
        logLevel: 'error'
      };

      this.ua = new UserAgent(options);
      this.registerer = new Registerer(this.ua);

      this.registerer.stateChange.addListener(state => {
        if (state === RegistererState.Registered)   this.store.setSipStatus('REGISTERED');
        if (state === RegistererState.Unregistered) this.store.setSipStatus('UNREGISTERED');
      });

      await this.ua.start();
      await this.registerer.register();
    } catch (err) {
      console.error('[SipService] initialize() failed:', err);
      this.store.setSipStatus('UNREGISTERED');
    }
  }

  /**
   * Places an outbound SIP call.
   * Must be called after {@link initialize} has completed registration.
   *
   * @param phoneNumber     E.164 number to dial
   * @param sipDomain       Asterisk SIP domain (needed to build the target URI)
   * @param crmSessionId    Public ID of the already-created CRM CallSession
   */
  async call(phoneNumber: string, sipDomain: string, crmSessionId: string): Promise<void> {
    if (!this.ua) return;

    this.sessionPublicId = crmSessionId;
    this.wasAnswered = false;

    const target = UserAgent.makeURI(`sip:${phoneNumber}@${sipDomain}`);
    if (!target) return;

    this.session = new Inviter(this.ua, target);

    this.session.stateChange.addListener(async state => {
      switch (state) {

        case SessionState.Establishing:
          this.store.setCallPhase('RINGING');
          break;

        case SessionState.Established:
          this.wasAnswered = true;
          this.store.setCallPhase('ACTIVE');
          this._attachRemoteAudio();
          if (this.sessionPublicId) {
            this.api.answer(this.sessionPublicId).subscribe();
          }
          break;

        case SessionState.Terminated:
          await this._onTerminated();
          break;
      }
    });

    await this.session.invite();
  }

  /**
   * Cancels or terminates the active call.
   *
   * Uses optimistic UI: the store is cleared immediately so the widget closes
   * at once, regardless of whether Asterisk responds to the CANCEL.
   * The CANCEL/BYE and backend PATCH are then sent fire-and-forget.
   */
  async hangup(): Promise<void> {
    const sessionRef  = this.session;
    const publicId    = this.sessionPublicId;
    const wasAnswered = this.wasAnswered;

    // Optimistic clear — widget closes immediately
    this.session         = null;
    this.sessionPublicId = null;
    this._detachRemoteAudio();
    this.store.clearActiveCall();

    if (!sessionRef) return;

    try {
      if (sessionRef.state === SessionState.Establishing ||
          sessionRef.state === SessionState.Initial) {
        await sessionRef.cancel();
      } else if (sessionRef.state === SessionState.Established) {
        await sessionRef.bye();
      }
    } catch { /* already gone */ }

    if (publicId) {
      const status = wasAnswered ? 'ENDED' : 'MISSED';
      this.api.terminate(publicId, { status }).subscribe({
        next:  () => this.feedback.showSuccess('Appel terminé — interaction enregistrée.'),
        error: () => this.feedback.showError("Erreur lors de la clôture de l'appel.")
      });
    }
  }

  /** Mutes or unmutes the local audio track on the WebRTC peer connection. */
  toggleMute(): void {
    const muted = !this.store.isMuted();
    // Cast needed: the generic SessionDescriptionHandler interface doesn't expose
    // peerConnection — the web implementation (sip.js/lib/platform/web) does.
    const sdh = this.session?.sessionDescriptionHandler as { peerConnection?: RTCPeerConnection } | undefined;
    sdh?.peerConnection?.getSenders().forEach(s => {
      if (s.track?.kind === 'audio') s.track.enabled = !muted;
    });
    this.store.setMuted(muted);
  }

  ngOnDestroy(): void {
    this._detachRemoteAudio();
    this.registerer?.unregister().catch(() => {});
    this.ua?.stop().catch(() => {});
  }

  // =========================================================================
  // Private
  // =========================================================================

  private _attachRemoteAudio(): void {
    const sdh = this.session?.sessionDescriptionHandler as { peerConnection?: RTCPeerConnection } | undefined;
    const pc  = sdh?.peerConnection;
    if (!pc) return;

    const stream = new MediaStream();
    pc.getReceivers().forEach(r => { if (r.track) stream.addTrack(r.track); });

    let el = document.getElementById('sip-remote-audio') as HTMLAudioElement | null;
    if (!el) {
      el = document.createElement('audio');
      el.id = 'sip-remote-audio';
      el.autoplay = true;
      document.body.appendChild(el);
    }
    el.srcObject = stream;
  }

  private _detachRemoteAudio(): void {
    const el = document.getElementById('sip-remote-audio') as HTMLAudioElement | null;
    if (el) { el.srcObject = null; el.remove(); }
  }

  private async _onTerminated(): Promise<void> {
    const publicId = this.sessionPublicId;
    this.session           = null;
    this.sessionPublicId   = null;
    this._detachRemoteAudio();

    if (!publicId) {
      this.store.clearActiveCall();
      return;
    }

    this.store.setTerminating(true);
    const status = this.wasAnswered ? 'ENDED' : 'MISSED';

    this.api.terminate(publicId, { status }).subscribe({
      next: () => {
        this.store.clearActiveCall();
        this.feedback.showSuccess('Appel terminé — interaction enregistrée.');
      },
      error: () => {
        this.store.clearActiveCall();
        this.feedback.showError("Erreur lors de la clôture de l'appel.");
      }
    });
  }
}
