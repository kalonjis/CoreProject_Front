import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalLayoutComponent } from '../../../../../shared/components/modal-layout/modal-layout.component';
import { CrmInteractionApiService } from '../../../services/crm-interaction-api.service';
import { FeedbackService } from '../../../../../../../shared/feedback/tools/feedback.service';
import {
  InteractionType,
  InteractionDirection,
  InteractionOutcome,
  CallStatus,
  LogInteractionRequest,
  CALL_STATUS_LABELS,
  INTERACTION_OUTCOME_LABELS
} from '../../../models/interaction.model';

/**
 * Modal for logging a past phone call interaction.
 *
 * Sends a {@link LogInteractionRequest} of type CALL with a nested
 * {@link CallLogRequest} containing the call status and duration.
 * The accent color is blue (#2563eb) to match the call action theme.
 */
@Component({
  selector: 'app-log-call-modal',
  imports: [FormsModule, ModalLayoutComponent],
  templateUrl: './log-call-modal.component.html',
  styleUrl: './log-call-modal.component.scss'
})
export class LogCallModalComponent {

  /** Public ID of the contact this call is logged against. */
  @Input() contactPublicId?: string;
  /** Public ID of the lead this call is logged against. */
  @Input() leadPublicId?: string;
  /** Public ID of the deal this call is logged against. */
  @Input() dealPublicId?: string;

  /** Emitted after the interaction has been successfully saved. */
  @Output() logged    = new EventEmitter<void>();
  /** Emitted when the user dismisses the modal without saving. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmInteractionApiService);
  private readonly feedback = inject(FeedbackService);

  /** True while the HTTP request is in flight. */
  readonly saving = signal(false);

  // ─── Accent ──────────────────────────────────────────────────────────────
  readonly accentColor = '#2563eb';

  // ─── Form fields ─────────────────────────────────────────────────────────

  /** ISO datetime of when the call occurred. Defaults to now. */
  occurredAt   = new Date().toISOString().slice(0, 16);
  /** Result status of the call. */
  callStatus: CallStatus = CallStatus.ANSWERED;
  /** Call duration entered by the user in minutes. */
  durationMinutes: number | null = null;
  /** Short summary / subject of the call. */
  subject = '';
  /** Optional qualitative outcome. */
  outcome: InteractionOutcome | '' = '';
  /** Optional call direction. */
  direction: InteractionDirection | '' = '';
  /** Optional free-text notes about the call. */
  notes = '';

  // ─── Enum collections for selects ────────────────────────────────────────
  readonly callStatuses = Object.values(CallStatus);
  readonly outcomes     = Object.values(InteractionOutcome);
  readonly directions   = Object.values(InteractionDirection);

  /** Returns the human-readable label for a {@link CallStatus}. */
  callStatusLabel(s: CallStatus): string         { return CALL_STATUS_LABELS[s]; }
  /** Returns the human-readable label for an {@link InteractionOutcome}. */
  outcomeLabel(o: InteractionOutcome): string    { return INTERACTION_OUTCOME_LABELS[o]; }
  /** Returns the human-readable label for a call direction. */
  directionLabel(d: InteractionDirection): string {
    return d === InteractionDirection.INBOUND ? 'Entrant' : 'Sortant';
  }

  /**
   * Validates form fields, builds the {@link LogInteractionRequest} payload
   * and posts it to the API. Emits {@link logged} on success.
   */
  submit(): void {
    if (!this.subject.trim()) return;

    const body: LogInteractionRequest = {
      type:       InteractionType.CALL,
      subject:    this.subject.trim(),
      occurredAt: new Date(this.occurredAt).toISOString(),
      callLog:    { status: this.callStatus },
      ...(this.durationMinutes && { durationMinutes: this.durationMinutes }),
      ...(this.outcome         && { outcome: this.outcome as InteractionOutcome }),
      ...(this.direction       && { direction: this.direction as InteractionDirection }),
      ...(this.notes.trim()   && { notes: this.notes.trim() }),
      ...(this.contactPublicId && { contactPublicId: this.contactPublicId }),
      ...(this.leadPublicId    && { leadPublicId:    this.leadPublicId }),
      ...(this.dealPublicId    && { dealPublicId:    this.dealPublicId }),
    };

    this.saving.set(true);
    this.api.log(body).subscribe({
      next:  () => { this.saving.set(false); this.feedback.showSuccess('Appel enregistré.'); this.logged.emit(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de l\'enregistrement.'); }
    });
  }
}
