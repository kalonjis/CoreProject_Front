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
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;

      &--new        { background: #dbeafe; color: #1d4ed8; }
      &--engaged    { background: #ffedd5; color: #9a3412; }
      &--qualified  { background: #ede9fe; color: #6d28d9; }
      &--client     { background: #dcfce7; color: #166534; }
      &--lost       { background: #fee2e2; color: #991b1b; }
      &--inactive   { background: #f1f5f9; color: #475569; }
    }
  `]
})
export class ContactStatusBadgeComponent {
  @Input({ required: true }) status!: ContactStatus;

  get label(): string {
    return CONTACT_STATUS_LABELS[this.status] ?? this.status;
  }
}
