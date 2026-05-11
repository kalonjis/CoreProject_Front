import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommercialActionResponse, CommercialActionType, CompleteCommercialActionRequest } from '../../models/commercial-action.model';
import { CompleteTaskFormComponent }    from '../complete/complete-task-form/complete-task-form.component';
import { CompleteCallFormComponent }    from '../complete/complete-call-form/complete-call-form.component';
import { CompleteEmailFormComponent }   from '../complete/complete-email-form/complete-email-form.component';
import { CompleteMeetingFormComponent } from '../complete/complete-meeting-form/complete-meeting-form.component';
import { CompleteDemoFormComponent }    from '../complete/complete-demo-form/complete-demo-form.component';

@Component({
  selector: 'app-commercial-action-complete-form',
  imports: [
    CompleteTaskFormComponent,
    CompleteCallFormComponent,
    CompleteEmailFormComponent,
    CompleteMeetingFormComponent,
    CompleteDemoFormComponent
  ],
  templateUrl: './commercial-action-complete-form.component.html'
})
/** Modal form that delegates to type-specific completion sub-forms (call, email, meeting, demo, task). */
export class CommercialActionCompleteFormComponent {
  /** The action being completed; used to select the appropriate sub-form. */
  @Input({ required: true }) action!: CommercialActionResponse;
  /** Emitted with optional completion details when the user confirms. */
  @Output() confirmed = new EventEmitter<CompleteCommercialActionRequest | undefined>();
  /** Emitted when the user cancels without confirming. */
  @Output() cancelled = new EventEmitter<void>();

  /** Exposed to the template for type-based branching. */
  readonly CommercialActionType = CommercialActionType;
}
