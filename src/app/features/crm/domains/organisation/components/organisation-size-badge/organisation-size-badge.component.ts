import { Component, Input } from '@angular/core';
import { OrganisationSize, ORGANISATION_SIZE_LABELS } from '../../models/organisation.model';

@Component({
  selector: 'app-organisation-size-badge',
  template: `
    <span [class]="'org-size-badge org-size-badge--' + size.toLowerCase()">
      {{ labels[size] }}
    </span>
  `,
  styles: [`
    .org-size-badge {
      display: inline-block;
      padding: 0.2em 0.55em;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
      background: #f1f5f9;
      color: #475569;
    }
  `]
})
export class OrganisationSizeBadgeComponent {
  @Input({ required: true }) size!: OrganisationSize;
  readonly labels = ORGANISATION_SIZE_LABELS;
}
