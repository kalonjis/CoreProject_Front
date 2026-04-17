import { Component, Input } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DealDetail, CONTACT_ROLE_LABELS, ContactRole } from '../../models/deal.model';
import { DealStatusBadgeComponent } from '../deal-status-badge/deal-status-badge.component';

@Component({
  selector: 'app-deal-info-card',
  imports: [DatePipe, CurrencyPipe, RouterLink, DealStatusBadgeComponent],
  templateUrl: './deal-info-card.component.html',
  styleUrl: './deal-info-card.component.scss'
})
/** Read-only card displaying a deal's core fields, pipeline position, status badge, and linked contacts with their roles. */
export class DealInfoCardComponent {
  @Input({ required: true }) deal!: DealDetail;

  readonly roleLabels = CONTACT_ROLE_LABELS;
  readonly roleKeys   = Object.values(ContactRole);
}
