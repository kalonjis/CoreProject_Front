import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalLayoutComponent } from '../../../../../shared/components/modal-layout/modal-layout.component';
import { CrmInteractionApiService } from '../../../services/crm-interaction-api.service';
import { FeedbackService } from '../../../../../../../shared/feedback/tools/feedback.service';
import {
  InteractionType,
  InteractionOutcome,
  LogInteractionRequest,
  INTERACTION_OUTCOME_LABELS
} from '../../../models/interaction.model';

/**
 * Modal for logging a past meeting or demo as a CRM interaction.
 *
 * Captures participants (as the interaction subject), duration, outcome
 * and a free-text meeting notes field.
 * Sends a {@link LogInteractionRequest} of type MEETING.
 * The accent color is emerald green (#16a34a) to match the calendar agenda theme.
 */
@Component({
  selector: 'app-log-meeting-modal',
  imports: [FormsModule, ModalLayoutComponent],
  templateUrl: './log-meeting-modal.component.html',
  styleUrl: './log-meeting-modal.component.scss'
})
export class LogMeetingModalComponent {

  /** Public ID of the contact this meeting is logged against. */
  @Input() contactPublicId?: string;
  /** Public ID of the lead this meeting is logged against. */
  @Input() leadPublicId?: string;
  /** Public ID of the deal this meeting is logged against. */
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
  readonly accentColor = '#16a34a';

  // ─── Form fields ─────────────────────────────────────────────────────────

  /** ISO datetime of when the meeting took place. Defaults to now. */
  occurredAt       = new Date().toISOString().slice(0, 16);
  /**
   * Participants string (e.g. "Alice, Bob") — stored as the interaction subject
   * so it appears as the title in the timeline.
   */
  participants     = '';
  /** Meeting duration in minutes. */
  durationMinutes: number | null = null;
  /** Free-text meeting minutes or outcome summary. */
  notes            = '';
  /** Optional qualitative outcome of the meeting. */
  outcome: InteractionOutcome | '' = '';

  // ─── Enum collections for selects ────────────────────────────────────────
  readonly outcomes = Object.values(InteractionOutcome);

  /** Returns the human-readable label for an {@link InteractionOutcome}. */
  outcomeLabel(o: InteractionOutcome): string { return INTERACTION_OUTCOME_LABELS[o]; }

  /**
   * Validates required fields, builds the {@link LogInteractionRequest} payload
   * and posts it to the API. Emits {@link logged} on success.
   */
  submit(): void {
    if (!this.participants.trim()) return;

    const body: LogInteractionRequest = {
      type:       InteractionType.MEETING,
      subject:    this.participants.trim(),
      occurredAt: new Date(this.occurredAt).toISOString(),
      ...(this.notes.trim()        && { notes:           this.notes.trim() }),
      ...(this.durationMinutes     && { durationMinutes: this.durationMinutes }),
      ...(this.outcome             && { outcome:         this.outcome as InteractionOutcome }),
      ...(this.contactPublicId     && { contactPublicId: this.contactPublicId }),
      ...(this.leadPublicId        && { leadPublicId:    this.leadPublicId }),
      ...(this.dealPublicId        && { dealPublicId:    this.dealPublicId }),
    };

    this.saving.set(true);
    this.api.log(body).subscribe({
      next:  () => { this.saving.set(false); this.feedback.showSuccess('Réunion enregistrée.'); this.logged.emit(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de l\'enregistrement.'); }
    });
  }
}
