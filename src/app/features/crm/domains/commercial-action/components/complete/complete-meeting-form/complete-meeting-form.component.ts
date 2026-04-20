import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommercialActionResponse, CompleteCommercialActionRequest } from '../../../models/commercial-action.model';
import { InteractionOutcome } from '../../../../interaction/models/interaction.model';

@Component({
  selector: 'app-complete-meeting-form',
  imports: [FormsModule],
  templateUrl: './complete-meeting-form.component.html',
  styleUrl:    './complete-meeting-form.component.scss'
})
/** Completion form for MEETING-type commercial actions, capturing outcome and notes. */
export class CompleteMeetingFormComponent {
  @Input({ required: true }) action!: CommercialActionResponse;
  @Output() confirmed = new EventEmitter<CompleteCommercialActionRequest>();
  @Output() cancelled = new EventEmitter<void>();

  readonly InteractionOutcome = InteractionOutcome;

  outcome = signal<InteractionOutcome | null>(null);
  notes   = signal('');

  selectOutcome(o: InteractionOutcome): void {
    this.outcome.set(this.outcome() === o ? null : o);
  }

  submit(): void {
    this.confirmed.emit({
      meetingLogDetails: {
        outcome: this.outcome() ?? undefined,
        notes:   this.notes().trim() || undefined
      }
    });
  }
}
