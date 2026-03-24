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
  @Input() dealPublicId?: string;
  @Input() contactPublicId?: string;
  @Input() leadPublicId?: string;
  @Input() defaultType?: InteractionType;
  @Input() defaultSubject?: string;
  @Input() defaultNotes?: string;
  @Input() defaultDurationMinutes?: number;
  @Output() logged    = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmInteractionApiService);
  private readonly feedback = inject(FeedbackService);

  readonly saving = signal(false);

  // ─── Form fields ──────────────────────────────────────────────────────────

  type: InteractionType            = InteractionType.NOTE;
  direction: InteractionDirection | '' = '';
  subject    = '';
  notes      = '';
  outcome: InteractionOutcome | '' = '';
  durationMinutes: number | null   = null;
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

  readonly types      = Object.values(InteractionType);
  readonly directions = Object.values(InteractionDirection);
  readonly outcomes   = Object.values(InteractionOutcome);
  readonly callStatuses = Object.values(CallStatus);

  typeLabel(t: InteractionType)       { return INTERACTION_TYPE_LABELS[t]; }
  outcomeLabel(o: InteractionOutcome) { return INTERACTION_OUTCOME_LABELS[o]; }
  callStatusLabel(s: CallStatus)      { return CALL_STATUS_LABELS[s]; }

  get isCall()  { return this.type === InteractionType.CALL; }
  get isEmail() { return this.type === InteractionType.EMAIL; }

  // ─── Submit ───────────────────────────────────────────────────────────────

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
