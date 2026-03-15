import { Component, Input } from '@angular/core';
import { LeadStatus, LEAD_STATUS_LABELS } from '../../models/lead.model';

@Component({
  selector: 'app-lead-status-badge',
  template: `
    <span [class]="'lead-status-badge lead-status-badge--' + status.toLowerCase()">
      {{ label }}
    </span>
  `,
  styles: [`
    .lead-status-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;

      &--new        { background: #dbeafe; color: #1d4ed8; }
      &--in_review  { background: #fef9c3; color: #92400e; }
      &--converted  { background: #dcfce7; color: #166534; }
      &--rejected   { background: #fee2e2; color: #991b1b; }
    }
  `]
})
export class LeadStatusBadgeComponent {
  @Input({ required: true }) status!: LeadStatus;

  get label(): string {
    return LEAD_STATUS_LABELS[this.status] ?? this.status;
  }
}
