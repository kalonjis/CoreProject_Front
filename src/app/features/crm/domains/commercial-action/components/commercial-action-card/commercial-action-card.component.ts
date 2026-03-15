import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CommercialActionResponse, CommercialActionStatus } from '../../models/commercial-action.model';
import { CommercialActionPriorityBadgeComponent } from '../commercial-action-priority-badge/commercial-action-priority-badge.component';
import { CommercialActionStatusBadgeComponent } from '../commercial-action-status-badge/commercial-action-status-badge.component';

@Component({
  selector: 'app-commercial-action-card',
  imports: [DatePipe, CommercialActionPriorityBadgeComponent, CommercialActionStatusBadgeComponent],
  templateUrl: './commercial-action-card.component.html',
  styleUrl: './commercial-action-card.component.scss'
})
export class CommercialActionCardComponent {
  @Input({ required: true }) action!: CommercialActionResponse;
  @Output() completed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<string>();

  readonly CommercialActionStatus = CommercialActionStatus;

  get isPending(): boolean { return this.action.status === CommercialActionStatus.PENDING; }
}
