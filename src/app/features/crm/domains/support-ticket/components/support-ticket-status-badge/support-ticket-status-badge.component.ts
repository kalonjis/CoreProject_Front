/**
 * Displays a colour-coded badge for a {@link SupportTicketStatus}.
 *
 * Each status (open, in-progress, resolved, closed) renders with a distinct style.
 */
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
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;

      &--open        { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
      &--in-progress { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
      &--resolved    { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
      &--closed      { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
    }
  `]
})
export class SupportTicketStatusBadgeComponent {
  /** Support ticket status to render. */
  @Input({ required: true }) status!: SupportTicketStatus;
  /** Human-readable label for the current status. */
  get label(): string { return SUPPORT_TICKET_STATUS_LABELS[this.status]; }
}
