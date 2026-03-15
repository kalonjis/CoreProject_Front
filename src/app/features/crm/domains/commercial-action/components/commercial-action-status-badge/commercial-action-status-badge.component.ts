import { Component, Input } from '@angular/core';
import { CommercialActionStatus, COMMERCIAL_ACTION_STATUS_LABELS } from '../../models/commercial-action.model';

@Component({
  selector: 'app-commercial-action-status-badge',
  template: `
    <span class="status-badge status-badge--{{ status.toLowerCase() }}">
      {{ label }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;

      &--pending   { background: #fef9c3; color: #854d0e; }
      &--done      { background: #d1fae5; color: #065f46; }
      &--cancelled { background: #f3f4f6; color: #6b7280; }
    }
  `]
})
export class CommercialActionStatusBadgeComponent {
  @Input({ required: true }) status!: CommercialActionStatus;
  get label(): string { return COMMERCIAL_ACTION_STATUS_LABELS[this.status]; }
}
