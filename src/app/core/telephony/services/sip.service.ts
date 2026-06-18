import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Invitation,
  Inviter,
  Registerer,
  RegistererState,
  Session,
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
 *     Sets ua.delegate.onInvite to handle inbound calls.
 *     Silently no-ops if no SIP config is assigned to the user.
 *  2. {@link call} — outbound: creates an Inviter. SIP events drive store + backend.
 *  3. {@link answer} — accepts a pending inbound Invitation; creates the backend session first.
 *  4. {@link reject} — declines a pending inbound Invitation (sends 486).
 *  5. {@link hangup} — BYE for established calls, CANCEL for outbound pre-answer.
 *  6. {@link toggleMute} — enables/disables the local audio track.
 */
@Injectable({ providedIn: 'root' })
export class SipService implements OnDestroy {

  private readonly api      = inject(CallApiService);
  private readonly store    = inject(CallStore);
  private readonly feedback = inject(FeedbackService);
  private readonly ngZone   = inject(NgZone);

  private ua: UserAgent | null          = null;
  private registerer: Registerer | null = null;

  /** Active established session (Inviter for outbound, Invitation for inbound after accept). */
  private session: Session | null = null;

  /** Pending inbound invitation not yet answered or rejected. */
  private _pendingInvitation: Invitation | null = null;

  /** Public ID of the current CRM session (set after POST /initiate). */
  private sessionPublicId: string | null = null;

  /** Whether the call was answered — used to pick ENDED vs MISSED on termination. */
  private wasAnswered = false;

  /** Web Audio context used for the inbound ringtone. */
  private _audioCtx: AudioContext | null = null;
  private _ringtoneTimer: ReturnType<typeof setInterval> | null = null;

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
    if (this.ua) return;
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
        logLevel: 'error',
      };

      this.ua = new UserAgent(options);

      // delegate must be set after construction — passing it in options is ignored in SIP.js 0.21
      // NgZone.run() needed: SIP.js callbacks fire outside Angular's zone
      this.ua.delegate = {
        onInvite: (invitation: Invitation) => this.ngZone.run(() => this._handleIncomingCall(invitation))
      };

      this.registerer = new Registerer(this.ua);

      this.registerer.stateChange.addListener(state => {
        if (state === RegistererState.Registered)   this.store.setSipStatus('REGISTERED');
        if (state === RegistererState.Unregistered) this.store.setSipStatus('UNREGISTERED');
      });

      await this.ua.start();
      await this.registerer.register();
    } catch {
      this.store.setSipStatus('UNREGISTERED');
    }
  }

  // =========================================================================
  // Outbound
  // =========================================================================

  /**
   * Places an outbound SIP call.
   *
   * @param phoneNumber     E.164 number or extension to dial
   * @param sipDomain       Asterisk SIP domain (needed to build the target URI)
   * @param crmSessionId    Public ID of the already-created CRM CallSession
   */
  async call(phoneNumber: string, sipDomain: string, crmSessionId: string): Promise<void> {
    if (!this.ua) return;

    this.sessionPublicId = crmSessionId;
    this.wasAnswered = false;

    const target = UserAgent.makeURI(`sip:${phoneNumber}@${sipDomain}`);
    if (!target) return;

    const inviter = new Inviter(this.ua, target);
    this.session = inviter;

    inviter.stateChange.addListener(state => this.ngZone.run(async () => {
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
    }));

    await inviter.invite();
  }

  // =========================================================================
  // Inbound
  // =========================================================================

  /**
   * Accepts the pending inbound invitation.
   *
   * Ordering: SIP accept() fires first (avoids invitation timeout during HTTP round-trip),
   * then the backend session is created in the background.
   */
  async answer(): Promise<void> {
    const invitation = this._pendingInvitation;
    if (!invitation) return;

    // Claim immediately — prevents _handleIncomingCall stateChange listener from interfering
    this._pendingInvitation = null;
    this._stopRinging();
    this.wasAnswered = false;

    // Switch widget to ACTIVE immediately for instant visual feedback.
    // wasAnswered is set in the Established handler (accurate for backend status).
    this.store.setCallPhase('ACTIVE');

    // Register listener BEFORE accept() to guarantee no state transition is missed.
    // ngZone.run() ensures Angular change detection fires even though SIP.js
    // callbacks execute outside the Angular zone.
    invitation.stateChange.addListener(state => this.ngZone.run(async () => {
      if (state === SessionState.Established) {
        this.wasAnswered = true;
        this.store.setCallPhase('ACTIVE');
        this._attachRemoteAudio();
        if (this.sessionPublicId) {
          this.api.answer(this.sessionPublicId).subscribe();
        }
      } else if (state === SessionState.Terminated) {
        await this._onTerminated();
      }
    }));

    // Accept SIP before any HTTP call — the invitation has a short TTL.
    try {
      await invitation.accept();
      this.session = invitation;
    } catch {
      this.store.clearActiveCall();
      return;
    }

    // Create backend session after SIP is secured — non-blocking on the audio path.
    const callerNumber = invitation.remoteIdentity.uri.user ?? 'unknown';
    this.api.initiate({ phoneNumber: callerNumber, direction: 'INBOUND' }).subscribe({
      next: session => {
        this.sessionPublicId = session.publicId;
        const current = this.store.activeCall();
        if (current) this.store.setActiveCall({ ...current, sessionPublicId: session.publicId });
      },
      error: () => this.feedback.showError("Impossible de créer la session d'appel.")
    });
  }

  /** Rejects the pending inbound invitation (sends 486 Busy Here). */
  async reject(): Promise<void> {
    const invitation = this._pendingInvitation;
    this._pendingInvitation = null;
    this._stopRinging();
    this.store.clearActiveCall();
    if (invitation) {
      try { await invitation.reject(); } catch { /* already gone */ }
    }
  }

  // =========================================================================
  // Shared actions
  // =========================================================================

  /**
   * Cancels or terminates the active call.
   *
   * Uses optimistic UI: the store is cleared immediately so the widget closes
   * at once, regardless of whether Asterisk responds.
   */
  async hangup(): Promise<void> {
    // INCOMING phase (not yet answered) → reject instead
    if (this._pendingInvitation) {
      await this.reject();
      return;
    }

    const sessionRef  = this.session;
    const publicId    = this.sessionPublicId;
    const wasAnswered = this.wasAnswered;

    this.session         = null;
    this.sessionPublicId = null;
    this._detachRemoteAudio();
    this.store.clearActiveCall();

    if (!sessionRef) return;

    try {
      if (sessionRef instanceof Inviter &&
          (sessionRef.state === SessionState.Establishing ||
           sessionRef.state === SessionState.Initial)) {
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
    const sdh = this.session?.sessionDescriptionHandler as { peerConnection?: RTCPeerConnection } | undefined;
    sdh?.peerConnection?.getSenders().forEach(s => {
      if (s.track?.kind === 'audio') s.track.enabled = !muted;
    });
    this.store.setMuted(muted);
  }

  ngOnDestroy(): void {
    this._stopRinging();
    this._detachRemoteAudio();
    this.registerer?.unregister().catch(() => {});
    this.ua?.stop().catch(() => {});
  }

  // =========================================================================
  // Private — inbound call handler
  // =========================================================================

  private _handleIncomingCall(invitation: Invitation): void {
    // Busy: reject silently if another call is active
    if (this.store.isCallActive()) {
      invitation.reject();
      return;
    }

    this.wasAnswered = false;
    const callerNumber = invitation.remoteIdentity.uri.user ?? 'Inconnu';
    const callerName   = invitation.remoteIdentity.displayName || undefined;

    this._pendingInvitation = invitation;

    this.store.setActiveCall({
      sessionPublicId: '',
      phoneNumber:     callerNumber,
      displayName:     callerName,
      startedAt:       new Date().toISOString(),
      contactPublicId: null,
      leadPublicId:    null,
      provider:        'SIP',
      phase:           'INCOMING',
      direction:       'INBOUND',
    });

    this._startRinging();

    // Async caller identity lookup — updates widget name once resolved
    this.api.getCallerInfo(callerNumber).subscribe(info => {
      if (!info.displayName) return;
      const current = this.store.activeCall();
      if (current && current.phase === 'INCOMING') {
        this.store.setActiveCall({
          ...current,
          displayName:     info.displayName,
          contactPublicId: info.contactPublicId ?? current.contactPublicId,
        });
      }
    });

    // Caller hangs up before we answer
    invitation.stateChange.addListener(state => {
      if (state === SessionState.Terminated && this._pendingInvitation === invitation) {
        this._pendingInvitation = null;
        this._stopRinging();
        this.store.clearActiveCall();
        this.feedback.showInfo('Appel entrant manqué.');
      }
    });
  }

  // =========================================================================
  // Private — audio / media
  // =========================================================================

  private _startRinging(): void {
    try {
      this._audioCtx = new AudioContext();
      const ctx = this._audioCtx;

      const playBeep = (startTime: number) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 480;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      };

      const ring = () => {
        if (!this._audioCtx) return;
        const now = this._audioCtx.currentTime;
        playBeep(now);
        playBeep(now + 0.45);
      };

      ring();
      this._ringtoneTimer = setInterval(() => ring(), 3000);
    } catch { /* AudioContext not available */ }
  }

  private _stopRinging(): void {
    if (this._ringtoneTimer) {
      clearInterval(this._ringtoneTimer);
      this._ringtoneTimer = null;
    }
    this._audioCtx?.close().catch(() => {});
    this._audioCtx = null;
  }

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
    this.session         = null;
    this.sessionPublicId = null;
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
