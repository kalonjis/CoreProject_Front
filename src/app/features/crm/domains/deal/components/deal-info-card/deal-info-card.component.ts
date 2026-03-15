import { Component, Input } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DealDetail } from '../../models/deal.model';
import { DealStatusBadgeComponent } from '../deal-status-badge/deal-status-badge.component';

@Component({
  selector: 'app-deal-info-card',
  imports: [DatePipe, CurrencyPipe, RouterLink, DealStatusBadgeComponent],
  templateUrl: './deal-info-card.component.html',
  styleUrl: './deal-info-card.component.scss'
})
export class DealInfoCardComponent {
  @Input({ required: true }) deal!: DealDetail;
}
