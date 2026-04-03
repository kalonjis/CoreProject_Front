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
      padding: 0.2em 0.55em;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .org-status-badge--prospect { background: #fff3e0; color: #e65100; }
    .org-status-badge--client   { background: #e8f5e9; color: #2e7d32; }
  `]
})
export class OrganisationStatusBadgeComponent {
  @Input({ required: true }) status!: OrganisationStatus;
  readonly labels = ORGANISATION_STATUS_LABELS;
}
