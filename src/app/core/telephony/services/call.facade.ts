import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CallApiService } from './call-api.service';
import { SipService } from './sip.service';
import { TwilioService } from './twilio.service';
import { CallStore } from '../state/call.store';
import { FeedbackService } from '../../../shared/feedback/tools/feedback.service';
import { TerminalCallStatus } from '../models/call-session.model';

/**
 * Facade orchestrating the full outbound call lifecycle.
 *
 * Routing strategy (evaluated in priority order):
 *  1. Mobile device                     → TEL_URI (tel: URI + manual widget)
 *  2. Desktop + SIP registered           → SIP (per-user config, overrides global)
 *  3. Desktop + Twilio Device registered → TWILIO (Twilio Voice SDK in-browser audio)
 *  4. Fallback                           → TEL_URI
 *
 * SIP / Twilio flow:
 *  1. POST /api/crm/calls → get session publicId
 *  2. [Twilio|Sip]Service.call() → WebRTC in-browser audio
 *  3. SDK events auto-drive PATCH /answer and PATCH /terminate
 *
 * TEL_URI flow:
 *  1. POST /api/crm/calls
 *  2. window.location.href = tel:<number>
 *  3. User declares outcome in the widget
 */
@Injectable({ providedIn: 'root' })
export class CallFacade {

  private readonly api      = inject(CallApiService);
  private readonly sip      = inject(SipService);
  private readonly twilio   = inject(TwilioService);
  private readonly store    = inject(CallStore);
  private readonly feedback = inject(FeedbackService);

  // ── Passthrough selectors ─────────────────────────────────────────────────

  readonly activeCall    = this.store.activeCall;
  readonly isCallActive  = this.store.isCallActive;
  readonly isInitiating  = this.store.isInitiating;
  readonly isTerminating = this.store.isTerminating;
  readonly isMuted       = this.store.isMuted;
  readonly isRinging     = this.store.isRinging;
  readonly sipHasConfig  = this.store.sipHasConfig;

  // ── Actions ───────────────────────────────────────────────────────────────

  initiate(phoneNumber: string, contactPublicId?: string, leadPublicId?: string): void {
    if (this.store.isCallActive()) {
      this.feedback.showWarning('Un appel est déjà en cours.');
      return;
    }

    if (this._isMobile()) {
      this._initiateViaTelUri(phoneNumber, contactPublicId, leadPublicId);
    } else if (this.sip.isRegistered()) {
      this._initiateViaSip(phoneNumber, contactPublicId, leadPublicId);
    } else if (this.store.sipHasConfig()) {
      this.feedback.showError('SIP non disponible — vérifiez la connexion Asterisk.');
    } else if (this.twilio.isRegistered()) {
      this._initiateViaTwilio(phoneNumber, contactPublicId, leadPublicId);
    } else {
      this._initiateViaTelUri(phoneNumber, contactPublicId, leadPublicId);
    }
  }

  /**
   * Terminates a TEL_URI call (SIP calls are terminated via SipService.hangup()).
   * The backend listener automatically creates the Interaction + CallLog.
   */
  terminate(status: TerminalCallStatus, durationSeconds?: number): void {
    const call = this.store.activeCall();
    if (!call) return;

    this.store.setTerminating(true);

    this.api.terminate(call.sessionPublicId, {
      status,
      ...(durationSeconds !== undefined && { durationSeconds }),
    }).subscribe({
      next: () => {
        this.store.clearActiveCall();
        this.feedback.showSuccess('Appel terminé — interaction enregistrée.');
      },
      error: () => {
        this.store.setTerminating(false);
        this.feedback.showError("Erreur lors de la clôture de l'appel.");
      }
    });
  }

  /** Hangs up a SIP or Twilio call (the respective service handles the rest). */
  hangup(): void {
    const provider = this.store.activeCall()?.provider;
    if (provider === 'TWILIO') {
      this.twilio.hangup();
    } else {
      this.sip.hangup();
    }
  }

  /** Toggles mute on the active SIP or Twilio call. */
  toggleMute(): void {
    const provider = this.store.activeCall()?.provider;
    if (provider === 'TWILIO') {
      this.twilio.toggleMute();
    } else {
      this.sip.toggleMute();
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _initiateViaTelUri(
    phoneNumber: string,
    contactPublicId?: string,
    leadPublicId?: string
  ): void {
    this.store.setInitiating(true);

    this.api.initiate({
      phoneNumber,
      ...(contactPublicId && { contactPublicId }),
      ...(leadPublicId    && { leadPublicId }),
    }).subscribe({
      next: session => {
        this.store.setActiveCall({
          sessionPublicId: session.publicId,
          phoneNumber:     session.phoneNumber,
          startedAt:       session.startedAt,
          contactPublicId: session.contactPublicId,
          leadPublicId:    session.leadPublicId,
          provider:        'TEL_URI',
          phase:           'ACTIVE',
        });
        window.location.href = `tel:${phoneNumber}`;
      },
      error: () => {
        this.store.setInitiating(false);
        this.feedback.showError("Impossible d'initier l'appel.");
      }
    });
  }

  private _initiateViaTwilio(
    phoneNumber: string,
    contactPublicId?: string,
    leadPublicId?: string
  ): void {
    this.store.setInitiating(true);

    this.api.initiate({
      phoneNumber,
      ...(contactPublicId && { contactPublicId }),
      ...(leadPublicId    && { leadPublicId }),
    }).subscribe({
      next: async session => {
        this.store.setActiveCall({
          sessionPublicId: session.publicId,
          phoneNumber:     session.phoneNumber,
          startedAt:       session.startedAt,
          contactPublicId: session.contactPublicId,
          leadPublicId:    session.leadPublicId,
          provider:        'TWILIO',
          phase:           'RINGING',
        });

        try {
          await this.twilio.call(phoneNumber, session.publicId);
        } catch {
          this.store.clearActiveCall();
          this.feedback.showError("Impossible d'établir l'appel Twilio.");
        }
      },
      error: () => {
        this.store.setInitiating(false);
        this.feedback.showError("Impossible d'initier l'appel.");
      }
    });
  }

  private _initiateViaSip(
    phoneNumber: string,
    contactPublicId?: string,
    leadPublicId?: string
  ): void {
    this.store.setInitiating(true);

    this.api.initiate({
      phoneNumber,
      ...(contactPublicId && { contactPublicId }),
      ...(leadPublicId    && { leadPublicId }),
    }).subscribe({
      next: async session => {
        this.store.setActiveCall({
          sessionPublicId: session.publicId,
          phoneNumber:     session.phoneNumber,
          startedAt:       session.startedAt,
          contactPublicId: session.contactPublicId,
          leadPublicId:    session.leadPublicId,
          provider:        'SIP',
          phase:           'RINGING',
        });

        try {
          const creds = await firstValueFrom(this.api.getSipConnectionDetails());
          await this.sip.call(phoneNumber, creds.sipDomain, session.publicId);
        } catch {
          this.store.clearActiveCall();
          this.feedback.showError("Impossible d'établir l'appel SIP.");
        }
      },
      error: () => {
        this.store.setInitiating(false);
        this.feedback.showError("Impossible d'initier l'appel.");
      }
    });
  }

  private _isMobile(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
}
