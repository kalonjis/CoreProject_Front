import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommercialActionResponse, CompleteCommercialActionRequest } from '../../../models/commercial-action.model';

@Component({
  selector: 'app-complete-task-form',
  templateUrl: './complete-task-form.component.html',
  styleUrl:    './complete-task-form.component.scss'
})
/** Completion confirmation form for TASK-type commercial actions (no additional details required). */
export class CompleteTaskFormComponent {
  @Input({ required: true }) action!: CommercialActionResponse;
  @Output() confirmed = new EventEmitter<CompleteCommercialActionRequest | undefined>();
  @Output() cancelled = new EventEmitter<void>();

  submit(): void {
    this.confirmed.emit(undefined);
  }
}
