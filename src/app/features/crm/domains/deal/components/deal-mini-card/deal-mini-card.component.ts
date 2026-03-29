import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { DealSummary, DealStatus } from '../../models/deal.model';
import { DealStatusBadgeComponent } from '../deal-status-badge/deal-status-badge.component';

@Component({
  selector: 'app-deal-mini-card',
  imports: [DealStatusBadgeComponent, DatePipe, CurrencyPipe],
  templateUrl: './deal-mini-card.component.html',
  styleUrl: './deal-mini-card.component.scss'
})
export class DealMiniCardComponent {

  @Input({ required: true }) deal!: DealSummary;

  private readonly router = inject(Router);

  readonly DealStatus = DealStatus;

  navigate(): void {
    this.router.navigate(['/crm/deals', this.deal.publicId]);
  }
}
