import { Component, OnInit, inject } from '@angular/core';
import { CommercialActionFacade }    from '../../facades/commercial-action.facade';
import { CommercialActionStatus }    from '../../models/commercial-action.model';
import { CommercialActionCardComponent, CompleteEvent } from '../../components/commercial-action-card/commercial-action-card.component';

@Component({
  selector: 'app-commercial-action-list',
  imports: [CommercialActionCardComponent],
  templateUrl: './commercial-action-list.component.html',
  styleUrl: './commercial-action-list.component.scss'
})
/** Page component listing the current user's commercial actions with status filtering. */
export class CommercialActionListComponent implements OnInit {

  readonly facade = inject(CommercialActionFacade);
  /** Exposed to the template for status filter comparisons. */
  readonly CommercialActionStatus = CommercialActionStatus;

  ngOnInit(): void { this.facade.load(); }

  /** Applies the given status filter (undefined = all). */
  setFilter(status: CommercialActionStatus | undefined): void {
    this.facade.setFilter(status);
  }

  /** Delegates completion to the facade with the provided details. */
  onComplete(event: CompleteEvent): void {
    this.facade.complete(event.publicId, event.details);
  }

  /** Cancels the commercial action with the given public ID. */
  onCancel(publicId: string): void {
    this.facade.cancel(publicId);
  }
}
