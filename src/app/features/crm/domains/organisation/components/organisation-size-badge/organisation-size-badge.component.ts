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
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .org-size-badge--micro      { background: #e8f5e9; color: #2e7d32; }
    .org-size-badge--small      { background: #e3f2fd; color: #1565c0; }
    .org-size-badge--medium     { background: #fff3e0; color: #e65100; }
    .org-size-badge--large      { background: #f3e5f5; color: #6a1b9a; }
    .org-size-badge--enterprise { background: #fce4ec; color: #880e4f; }
  `]
})
export class OrganisationSizeBadgeComponent {
  @Input({ required: true }) size!: OrganisationSize;
  readonly labels = ORGANISATION_SIZE_LABELS;
}
