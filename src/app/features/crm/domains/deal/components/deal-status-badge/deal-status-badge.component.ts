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
      padding: 0.2em 0.6em;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .deal-badge--open { background: #e3f2fd; color: #1565c0; }
    .deal-badge--won  { background: #e8f5e9; color: #2e7d32; }
    .deal-badge--lost { background: #fce4ec; color: #880e4f; }
  `]
})
export class DealStatusBadgeComponent {
  @Input({ required: true }) status!: DealStatus;
  readonly labels = DEAL_STATUS_LABELS;
}
