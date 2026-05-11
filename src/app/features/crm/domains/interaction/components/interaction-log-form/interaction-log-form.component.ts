/**
 * Inline form for manually logging a CRM interaction (call, email, meeting, note, etc.).
 *
 * Supports logging against a deal, contact, or lead context.
 * Type-specific sub-sections (call log, email log) are shown dynamically.
 * Emits {@link logged} on success and {@link cancelled} when the user dismisses.
 */
import { Component, Input, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  InteractionType,
  InteractionDirection,
  InteractionOutcome,
  CallStatus,
  LogInteractionRequest,
  INTERACTION_TYPE_LABELS,
  INTERACTION_OUTCOME_LABELS,
  CALL_STATUS_LABELS
} from '../../models/interaction.model';
import { CrmInteractionApiService } from '../../services/crm-interaction-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-interaction-log-form',
  imports: [FormsModule],
  templateUrl: './interaction-log-form.component.html',
  styleUrl: './interaction-log-form.component.scss'
})
export class InteractionLogFormComponent implements OnInit {
  /** Public ID of the deal to associate with the logged interaction. */
  @Input() dealPublicId?: string;
  /** Public ID of the contact to associate with the logged interaction. */
  @Input() contactPublicId?: string;
  /** Public ID of the lead to associate with the logged interaction. */
  @Input() leadPublicId?: string;
  /** Pre-selected interaction type shown when the form opens. */
  @Input() defaultType?: InteractionType;
  /** Pre-filled subject value. */
  @Input() defaultSubject?: string;
  /** Pre-filled notes value. */
  @Input() defaultNotes?: string;
  /** Pre-filled duration in minutes. */
  @Input() defaultDurationMinutes?: number;
  /** Emits when the interaction has been successfully saved. */
  @Output() logged    = new EventEmitter<void>();
  /** Emits when the user cancels without saving. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmInteractionApiService);
  private readonly feedback = inject(FeedbackService);

  /** Whether the log request is in flight. */
  readonly saving = signal(false);

  type: InteractionType            = InteractionType.NOTE;
  direction: InteractionDirection | '' = '';
  subject    = '';
  notes      = '';
  outcome: InteractionOutcome | '' = '';
  durationMinutes: number | null   = null;
  /** ISO datetime string (minute precision) defaulting to now. */
  occurredAt = new Date().toISOString().slice(0, 16);

  ngOnInit(): void {
    if (this.defaultType)            this.type            = this.defaultType;
    if (this.defaultSubject)         this.subject         = this.defaultSubject;
    if (this.defaultNotes)           this.notes           = this.defaultNotes;
    if (this.defaultDurationMinutes) this.durationMinutes = this.defaultDurationMinutes;
  }

  // Call log fields
  callPhoneNumber  = '';
  callDurationSec: number | null = null;
  callStatus: CallStatus = CallStatus.ANSWERED;

  // Email log fields
  emailSubject  = '';
  emailSnippet  = '';
  emailMsgId    = '';

  // ─── Enum lists for selects ───────────────────────────────────────────────

  /** All possible interaction types for the type select. */
  readonly types      = Object.values(InteractionType);
  /** All possible interaction directions for the direction select. */
  readonly directions = Object.values(InteractionDirection);
  /** All possible interaction outcomes for the outcome select. */
  readonly outcomes   = Object.values(InteractionOutcome);
  /** All possible call statuses for the call log sub-section. */
  readonly callStatuses = Object.values(CallStatus);

  /** Returns the human-readable label for an interaction type. */
  typeLabel(t: InteractionType)       { return INTERACTION_TYPE_LABELS[t]; }
  /** Returns the human-readable label for an interaction outcome. */
  outcomeLabel(o: InteractionOutcome) { return INTERACTION_OUTCOME_LABELS[o]; }
  /** Returns the human-readable label for a call status. */
  callStatusLabel(s: CallStatus)      { return CALL_STATUS_LABELS[s]; }

  /** Returns true when the current type is CALL (shows call log sub-fields). */
  get isCall()  { return this.type === InteractionType.CALL; }
  /** Returns true when the current type is EMAIL (shows email log sub-fields). */
  get isEmail() { return this.type === InteractionType.EMAIL; }

  // ─── Submit ───────────────────────────────────────────────────────────────

  /** Builds the request payload (including optional call/email sub-logs) and sends it to the API. */
  submit(): void {
    if (!this.subject.trim()) return;

    const body: LogInteractionRequest = {
      type:      this.type,
      subject:   this.subject.trim(),
      occurredAt: new Date(this.occurredAt).toISOString(),
      ...(this.direction           && { direction: this.direction as InteractionDirection }),
      ...(this.notes.trim()        && { notes: this.notes.trim() }),
      ...(this.outcome             && { outcome: this.outcome as InteractionOutcome }),
      ...(this.durationMinutes     && { durationMinutes: this.durationMinutes }),
      ...(this.dealPublicId        && { dealPublicId: this.dealPublicId }),
      ...(this.contactPublicId     && { contactPublicId: this.contactPublicId }),
      ...(this.leadPublicId        && { leadPublicId: this.leadPublicId }),
    };

    if (this.isCall) {
      body.callLog = {
        status: this.callStatus,
        ...(this.callPhoneNumber.trim() && { phoneNumber: this.callPhoneNumber.trim() }),
        ...(this.callDurationSec        && { durationSeconds: this.callDurationSec }),
      };
    }

    if (this.isEmail && this.emailSubject.trim()) {
      body.emailLog = {
        emailSubject: this.emailSubject.trim(),
        ...(this.emailSnippet.trim() && { bodySnippet: this.emailSnippet.trim() }),
        ...(this.emailMsgId.trim()   && { externalMessageId: this.emailMsgId.trim() }),
      };
    }

    this.saving.set(true);
    this.api.log(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.feedback.showSuccess('Interaction enregistrée.');
        this.logged.emit();
      },
      error: () => {
        this.saving.set(false);
        this.feedback.showError('Erreur lors de l\'enregistrement.');
      }
    });
  }
}
