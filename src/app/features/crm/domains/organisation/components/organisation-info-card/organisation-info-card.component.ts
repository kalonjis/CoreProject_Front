import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { OrganisationDetail } from '../../models/organisation.model';
import { OrganisationSizeBadgeComponent } from '../organisation-size-badge/organisation-size-badge.component';
import { OrganisationStatusBadgeComponent } from '../organisation-status-badge/organisation-status-badge.component';
import { PhoneLinkComponent } from '../../../../../../shared/phone-link/phone-link.component';

@Component({
  selector: 'app-organisation-info-card',
  imports: [DatePipe, OrganisationSizeBadgeComponent, OrganisationStatusBadgeComponent, PhoneLinkComponent],
  templateUrl: './organisation-info-card.component.html',
  styleUrl: './organisation-info-card.component.scss'
})
/** Read-only card displaying an organisation's core fields, status and size badges, and audit timestamps. */
export class OrganisationInfoCardComponent {
  /** Full organisation details to display. */
  @Input({ required: true }) organisation!: OrganisationDetail;

  domainOf(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch { return url; }
  }
}
