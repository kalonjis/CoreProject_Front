import { Injectable, OnDestroy, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Device, Call } from '@twilio/voice-sdk';
import { FeedbackService } from '../../../shared/feedback/tools/feedback.service';
import { CallApiService } from './call-api.service';
import { CallStore } from '../state/call.store';

/**
 * Wraps the Twilio Voice SDK to manage the full WebRTC call lifecycle for the CRM.
 *
 * Lifecycle:
 *  1. {@link initialize} — called once by CrmShellComponent on load.
 *     Fetches a Twilio Access Token, creates the Device, and registers with Twilio.
 *     Silently no-ops if the active provider is not Twilio (404 from token endpoint).
 *  2. {@link call} — calls {@code device.connect()} with the customer's phone number
 *     and the CRM session public ID as custom params.
 *     Twilio forwards these params to the TwiML App URL, which:
 *       - Registers the Twilio CallSid on the CRM session (for webhook correlation)
 *       - Returns TwiML to dial the customer's phone
 *  3. {@link hangup} — disconnects the active call.
 *  4. {@link toggleMute} — enables/disables the microphone.
 *
 * Call state is driven by Twilio SDK events (ringing, accept, disconnect) and
 * mirrored to the {@link CallStore} so the call-widget updates in real time.
 */
@Injectable({ providedIn: 'root' })
export class TwilioService implements OnDestroy {

  private readonly api      = inject(CallApiService);
  private readonly store    = inject(CallStore);
  private readonly feedback = inject(FeedbackService);

  private device: Device | null      = null;
  private currentCall: Call | null   = null;

  /** Public ID of the current CRM session (set right after POST /initiate). */
  private sessionPublicId: string | null = null;

  /** Whether the call was answered (used to pick ENDED vs MISSED on termination). */
  private wasAnswered = false;

  // =========================================================================
  // Selectors (passthrough from store)
  // =========================================================================

  readonly isRegistered = this.store.isTwilioReady;

  // =========================================================================
  // Lifecycle
  // =========================================================================

  /**
   * Fetches a Twilio Access Token and registers the Device.
   * Called once when the CRM shell loads. Silently exits if Twilio is not the active provider.
   */
  async initialize(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getTwilioToken());
      if (!response?.token) return;

      this.store.setTwilioStatus('REGISTERING');

      this.device = new Device(response.token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU]
      });

      this.device.on('registered',   () => this.store.setTwilioStatus('REGISTERED'));
      this.device.on('unregistered', () => this.store.setTwilioStatus('UNREGISTERED'));
      this.device.on('error',        (error) => {
        this.store.setTwilioStatus('UNREGISTERED');
        console.error('[TwilioService] Device error:', error);
      });
      this.device.on('tokenWillExpire', () => this._refreshToken());

      await this.device.register();
    } catch {
      // Active provider is not Twilio — silently fall back
      this.store.setTwilioStatus('UNREGISTERED');
    }
  }

  /**
   * Places an outbound Twilio call.
   *
   * @param phoneNumber  E.164 number to dial (passed to TwiML as `To`)
   * @param crmSessionId Public ID of the already-created CRM CallSession
   */
  async call(phoneNumber: string, crmSessionId: string): Promise<void> {
    if (!this.device) return;

    this.sessionPublicId = crmSessionId;
    this.wasAnswered = false;

    this.currentCall = await this.device.connect({
      params: {
        To:            phoneNumber,
        callPublicId:  crmSessionId,
      }
    });

    this.currentCall.on('accept', () => {
      this.wasAnswered = true;
      this.store.setCallPhase('ACTIVE');
      if (this.sessionPublicId) {
        this.api.answer(this.sessionPublicId).subscribe();
      }
    });

    this.currentCall.on('disconnect', () => {
      this._onDisconnected();
    });

    this.currentCall.on('error', (error: Error) => {
      console.error('[TwilioService] Call error:', error);
      this._onDisconnected();
    });
  }

  /** Disconnects the active call. The disconnect event handles cleanup. */
  async hangup(): Promise<void> {
    if (!this.currentCall) return;
    try {
      this.currentCall.disconnect();
    } catch {
      // Already disconnected — ignore
    }
  }

  /** Mutes or unmutes the microphone on the active call. */
  toggleMute(): void {
    if (!this.currentCall) return;
    const muted = !this.store.isMuted();
    this.currentCall.mute(muted);
    this.store.setMuted(muted);
  }

  ngOnDestroy(): void {
    this.currentCall?.disconnect();
    this.device?.destroy();
  }

  // =========================================================================
  // Private
  // =========================================================================

  private async _refreshToken(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getTwilioToken());
      if (response?.token && this.device) {
        this.device.updateToken(response.token);
      }
    } catch {
      console.error('[TwilioService] Token refresh failed');
    }
  }

  private _onDisconnected(): void {
    const publicId = this.sessionPublicId;
    this.currentCall       = null;
    this.sessionPublicId   = null;

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
