/**
 * Displays a colour-coded badge for a {@link LeadStatus}.
 *
 * Each status maps to a distinct background/border colour following the CRM design system.
 */
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
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;

      &--new        { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
      &--in_review  { background: #fef9c3; color: #92400e; border: 1px solid #fef08a; }
      &--converted  { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
      &--rejected   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    }
  `]
})
export class LeadStatusBadgeComponent {
  /** Lead lifecycle status to render. */
  @Input({ required: true }) status!: LeadStatus;

  /** Human-readable label for the current status, falling back to the raw enum value. */
  get label(): string {
    return LEAD_STATUS_LABELS[this.status] ?? this.status;
  }
}
