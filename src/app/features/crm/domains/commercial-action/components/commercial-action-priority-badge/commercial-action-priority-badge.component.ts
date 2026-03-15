import { Component, Input } from '@angular/core';
import { CommercialActionPriority, COMMERCIAL_ACTION_PRIORITY_LABELS } from '../../models/commercial-action.model';

@Component({
  selector: 'app-commercial-action-priority-badge',
  template: `
    <span class="priority-badge priority-badge--{{ priority.toLowerCase() }}">
      {{ label }}
    </span>
  `,
  styles: [`
    .priority-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;

      &--low    { background: #f3f4f6; color: #6b7280; }
      &--medium { background: #dbeafe; color: #1d4ed8; }
      &--high   { background: #fee2e2; color: #991b1b; }
    }
  `]
})
export class CommercialActionPriorityBadgeComponent {
  @Input({ required: true }) priority!: CommercialActionPriority;
  get label(): string { return COMMERCIAL_ACTION_PRIORITY_LABELS[this.priority]; }
}
