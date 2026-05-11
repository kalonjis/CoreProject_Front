import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalLayoutComponent } from '../../../../../shared/components/modal-layout/modal-layout.component';
import { CrmInteractionApiService } from '../../../services/crm-interaction-api.service';
import { FeedbackService } from '../../../../../../../shared/feedback/tools/feedback.service';
import { InteractionType, LogInteractionRequest } from '../../../models/interaction.model';

/**
 * Modal for quickly jotting down a free-text note on a contact or lead.
 *
 * The simplest log modal: date + a single text area mapped to {@link LogInteractionRequest.subject}.
 * Sends an interaction of type NOTE.
 * The accent color is amber (#f59e0b).
 */
@Component({
  selector: 'app-log-note-modal',
  imports: [FormsModule, ModalLayoutComponent],
  templateUrl: './log-note-modal.component.html',
  styleUrl: './log-note-modal.component.scss'
})
export class LogNoteModalComponent {

  /** Public ID of the contact this note is logged against. */
  @Input() contactPublicId?: string;
  /** Public ID of the lead this note is logged against. */
  @Input() leadPublicId?: string;
  /** Public ID of the deal this note is logged against. */
  @Input() dealPublicId?: string;

  /** Emitted after the note has been successfully saved. */
  @Output() logged    = new EventEmitter<void>();
  /** Emitted when the user dismisses the modal without saving. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmInteractionApiService);
  private readonly feedback = inject(FeedbackService);

  /** True while the HTTP request is in flight. */
  readonly saving = signal(false);

  // ─── Accent ──────────────────────────────────────────────────────────────
  readonly accentColor = '#f59e0b';

  // ─── Form fields ─────────────────────────────────────────────────────────

  /** ISO datetime for the note. Defaults to now. */
  occurredAt = new Date().toISOString().slice(0, 16);
  /** Content of the note — mapped to {@link LogInteractionRequest.subject}. */
  text = '';

  /**
   * Validates the note text, builds the {@link LogInteractionRequest} payload
   * and posts it to the API. Emits {@link logged} on success.
   */
  submit(): void {
    if (!this.text.trim()) return;

    const body: LogInteractionRequest = {
      type:       InteractionType.NOTE,
      subject:    this.text.trim(),
      occurredAt: new Date(this.occurredAt).toISOString(),
      ...(this.contactPublicId && { contactPublicId: this.contactPublicId }),
      ...(this.leadPublicId    && { leadPublicId:    this.leadPublicId }),
      ...(this.dealPublicId    && { dealPublicId:    this.dealPublicId }),
    };

    this.saving.set(true);
    this.api.log(body).subscribe({
      next:  () => { this.saving.set(false); this.feedback.showSuccess('Note enregistrée.'); this.logged.emit(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de l\'enregistrement.'); }
    });
  }
}
