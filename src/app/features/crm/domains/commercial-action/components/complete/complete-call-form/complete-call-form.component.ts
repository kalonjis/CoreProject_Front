import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CommercialActionResponse,
  CompleteCommercialActionRequest,
  CallStatus,
  CALL_STATUS_LABELS
} from '../../../models/commercial-action.model';

@Component({
  selector: 'app-complete-call-form',
  imports: [FormsModule],
  templateUrl: './complete-call-form.component.html',
  styleUrl:    './complete-call-form.component.scss'
})
/** Completion form specific to CALL-type commercial actions, capturing status, phone number, and duration. */
export class CompleteCallFormComponent {
  @Input({ required: true }) action!: CommercialActionResponse;
  @Output() confirmed = new EventEmitter<CompleteCommercialActionRequest>();
  @Output() cancelled = new EventEmitter<void>();

  readonly CallStatus    = CallStatus;
  readonly callStatuses  = Object.values(CallStatus);
  readonly statusLabel   = (s: CallStatus) => CALL_STATUS_LABELS[s];

  callStatus        = signal<CallStatus>(CallStatus.ANSWERED);
  phoneNumber       = signal('');
  durationSeconds   = signal<number | null>(null);

  submit(): void {
    this.confirmed.emit({
      callLogDetails: {
        status:          this.callStatus(),
        phoneNumber:     this.phoneNumber().trim() || undefined,
        durationSeconds: this.durationSeconds() ?? undefined
      }
    });
  }
}
