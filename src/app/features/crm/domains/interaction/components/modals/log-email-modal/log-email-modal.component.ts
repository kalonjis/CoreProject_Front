import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalLayoutComponent } from '../../../../../shared/components/modal-layout/modal-layout.component';
import { CrmInteractionApiService } from '../../../services/crm-interaction-api.service';
import { FeedbackService } from '../../../../../../../shared/feedback/tools/feedback.service';
import {
  InteractionType,
  InteractionDirection,
  InteractionOutcome,
  LogInteractionRequest,
  INTERACTION_OUTCOME_LABELS
} from '../../../models/interaction.model';

/**
 * Modal for archiving a past email exchange as a CRM interaction.
 *
 * Unlike {@link EmailComposeComponent} which sends a real email, this modal
 * only records that an exchange happened (subject + body snippet).
 * Sends a {@link LogInteractionRequest} of type EMAIL with a nested emailLog.
 * The accent color is sky blue (#0ea5e9).
 */
@Component({
  selector: 'app-log-email-modal',
  imports: [FormsModule, ModalLayoutComponent],
  templateUrl: './log-email-modal.component.html',
  styleUrl: './log-email-modal.component.scss'
})
export class LogEmailModalComponent {

  /** Public ID of the contact this email is logged against. */
  @Input() contactPublicId?: string;
  /** Public ID of the lead this email is logged against. */
  @Input() leadPublicId?: string;
  /** Public ID of the deal this email is logged against. */
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
  readonly accentColor = '#0ea5e9';

  // ─── Form fields ─────────────────────────────────────────────────────────

  /** ISO datetime of when the email was sent or received. Defaults to now. */
  occurredAt   = new Date().toISOString().slice(0, 16);
  /** Subject line of the email — also used as the interaction subject. */
  emailSubject = '';
  /** Optional short excerpt or body content of the email. */
  bodySnippet  = '';
  /** Whether the email was inbound (received) or outbound (sent). */
  direction: InteractionDirection | '' = InteractionDirection.OUTBOUND;
  /** Optional qualitative outcome of the exchange. */
  outcome: InteractionOutcome | '' = '';

  // ─── Enum collections for selects ────────────────────────────────────────
  readonly outcomes   = Object.values(InteractionOutcome);
  readonly directions = Object.values(InteractionDirection);

  /** Returns the human-readable label for an {@link InteractionOutcome}. */
  outcomeLabel(o: InteractionOutcome): string    { return INTERACTION_OUTCOME_LABELS[o]; }
  /** Returns the human-readable label for an email direction. */
  directionLabel(d: InteractionDirection): string {
    return d === InteractionDirection.INBOUND ? 'Reçu' : 'Envoyé';
  }

  /**
   * Validates form fields, builds the {@link LogInteractionRequest} payload
   * and posts it to the API. Emits {@link logged} on success.
   */
  submit(): void {
    if (!this.emailSubject.trim()) return;

    const body: LogInteractionRequest = {
      type:       InteractionType.EMAIL,
      subject:    this.emailSubject.trim(),
      occurredAt: new Date(this.occurredAt).toISOString(),
      emailLog:   {
        emailSubject: this.emailSubject.trim(),
        ...(this.bodySnippet.trim() && { bodySnippet: this.bodySnippet.trim() }),
      },
      ...(this.direction       && { direction: this.direction as InteractionDirection }),
      ...(this.outcome         && { outcome: this.outcome as InteractionOutcome }),
      ...(this.contactPublicId && { contactPublicId: this.contactPublicId }),
      ...(this.leadPublicId    && { leadPublicId:    this.leadPublicId }),
      ...(this.dealPublicId    && { dealPublicId:    this.dealPublicId }),
    };

    this.saving.set(true);
    this.api.log(body).subscribe({
      next:  () => { this.saving.set(false); this.feedback.showSuccess('Email archivé.'); this.logged.emit(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de l\'enregistrement.'); }
    });
  }
}
