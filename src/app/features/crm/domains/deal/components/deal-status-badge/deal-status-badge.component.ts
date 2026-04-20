import { Component, Input } from '@angular/core';
import { DealStatus, DEAL_STATUS_LABELS } from '../../models/deal.model';

@Component({
  selector: 'app-deal-status-badge',
  template: `
    <span [class]="'deal-badge deal-badge--' + status.toLowerCase()">
      {{ labels[status] }}
    </span>
  `,
  styles: [`
    .deal-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .deal-badge--open { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .deal-badge--won  { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .deal-badge--lost { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
  `]
})
/** Inline badge rendering a deal's outcome status with its colour-coded style. */
export class DealStatusBadgeComponent {
  @Input({ required: true }) status!: DealStatus;
  readonly labels = DEAL_STATUS_LABELS;
}
