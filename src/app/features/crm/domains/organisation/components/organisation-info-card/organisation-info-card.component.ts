import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { OrganisationDetail } from '../../models/organisation.model';
import { OrganisationSizeBadgeComponent } from '../organisation-size-badge/organisation-size-badge.component';
import { OrganisationStatusBadgeComponent } from '../organisation-status-badge/organisation-status-badge.component';

@Component({
  selector: 'app-organisation-info-card',
  imports: [DatePipe, OrganisationSizeBadgeComponent, OrganisationStatusBadgeComponent],
  templateUrl: './organisation-info-card.component.html',
  styleUrl: './organisation-info-card.component.scss'
})
export class OrganisationInfoCardComponent {
  @Input({ required: true }) organisation!: OrganisationDetail;
}
