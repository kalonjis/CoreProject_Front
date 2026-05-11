import { Component, Input } from '@angular/core';
import { OrganisationStatus, ORGANISATION_STATUS_LABELS } from '../../models/organisation.model';

@Component({
  standalone: true,
  selector: 'app-organisation-status-badge',
  template: `
    <span [class]="'org-status-badge org-status-badge--' + status.toLowerCase()">
      {{ labels[status] }}
    </span>
  `,
  styles: [`
    .org-status-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .org-status-badge--prospect { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    .org-status-badge--client   { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  `]
})
/** Inline badge rendering an organisation's lifecycle status with its colour-coded style. */
export class OrganisationStatusBadgeComponent {
  /** Organisation lifecycle status to render. */
  @Input({ required: true }) status!: OrganisationStatus;
  /** Label lookup table for template access. */
  readonly labels = ORGANISATION_STATUS_LABELS;
}
