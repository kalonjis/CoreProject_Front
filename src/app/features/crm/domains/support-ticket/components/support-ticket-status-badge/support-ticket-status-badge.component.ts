import { Component, Input } from '@angular/core';
import { SupportTicketStatus, SUPPORT_TICKET_STATUS_LABELS } from '../../models/support-ticket.model';

@Component({
  standalone: true,
  selector: 'app-support-ticket-status-badge',
  template: `
    <span class="ticket-status ticket-status--{{ status.toLowerCase().replaceAll('_', '-') }}">
      {{ label }}
    </span>
  `,
  styles: [`
    .ticket-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;

      &--open        { background: #dbeafe; color: #1d4ed8; }
      &--in-progress { background: #fef9c3; color: #854d0e; }
      &--resolved    { background: #d1fae5; color: #065f46; }
      &--closed      { background: #f3f4f6; color: #6b7280; }
    }
  `]
})
export class SupportTicketStatusBadgeComponent {
  @Input({ required: true }) status!: SupportTicketStatus;
  get label(): string { return SUPPORT_TICKET_STATUS_LABELS[this.status]; }
}
