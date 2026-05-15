import { Injectable, inject } from '@angular/core';
import { CallApiService } from './call-api.service';
import { CallStore } from '../state/call.store';
import { FeedbackService } from '../../../shared/feedback/tools/feedback.service';
import { TerminalCallStatus } from '../models/call-session.model';

/**
 * Facade orchestrating the full outbound call lifecycle.
 *
 * Flow:
 *  1. {@link initiate} → POST /api/crm/calls → store updated → tel: URI opened
 *  2. User handles the call via Windows Phone / OS dialler
 *  3. {@link terminate} → PATCH /api/crm/calls/:id/terminate → store cleared
 *     → backend listener auto-creates Interaction + CallLog
 */
@Injectable({ providedIn: 'root' })
export class CallFacade {

  private readonly api      = inject(CallApiService);
  private readonly store    = inject(CallStore);
  private readonly feedback = inject(FeedbackService);

  // ── Passthrough selectors ─────────────────────────────────────────────────

  readonly activeCall    = this.store.activeCall;
  readonly isCallActive  = this.store.isCallActive;
  readonly isInitiating  = this.store.isInitiating;
  readonly isTerminating = this.store.isTerminating;

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Initiates a call session on the server, opens the tel: URI for the OS dialler,
   * and activates the in-app call widget.
   */
  initiate(phoneNumber: string, contactPublicId?: string, leadPublicId?: string): void {
    if (this.store.isCallActive()) {
      this.feedback.showWarning('Un appel est déjà en cours.');
      return;
    }

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
        });
        window.location.href = `tel:${phoneNumber}`;
      },
      error: () => {
        this.store.setInitiating(false);
        this.feedback.showError("Impossible d'initier l'appel. Vérifiez votre connexion.");
      }
    });
  }

  /**
   * Terminates the active call session.
   * The backend listener automatically creates the Interaction + CallLog.
   *
   * @param status       Terminal status chosen by the user (ENDED / MISSED / FAILED).
   * @param durationSeconds  Declared call duration in seconds (required when ENDED).
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
}
