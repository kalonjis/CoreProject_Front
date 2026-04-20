import { Component, Input } from '@angular/core';
import { ContactStatus, CONTACT_STATUS_LABELS } from '../../models/contact.model';

@Component({
  selector: 'app-contact-status-badge',
  template: `
    <span [class]="'contact-status-badge contact-status-badge--' + status.toLowerCase()">
      {{ label }}
    </span>
  `,
  styles: [`
    .contact-status-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;

      &--new        { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
      &--engaged    { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
      &--qualified  { background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe; }
      &--client     { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
      &--lost       { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
      &--inactive   { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    }
  `]
})
/** Inline badge rendering a contact's lifecycle status with its colour-coded style. */
export class ContactStatusBadgeComponent {
  @Input({ required: true }) status!: ContactStatus;

  get label(): string {
    return CONTACT_STATUS_LABELS[this.status] ?? this.status;
  }
}
