import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DealFacade }   from '../../facades/deal.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { DealFilter, DealStatus, DEAL_STATUS_LABELS } from '../../models/deal.model';
import { DealStatusBadgeComponent } from '../../components/deal-status-badge/deal-status-badge.component';
import { CrmEmptyStateComponent }   from '../../../../shared/empty-state/crm-empty-state.component';

@Component({
  selector: 'app-deal-list',
  providers: [DealFacade, InteractionFacade],
  imports: [FormsModule, DatePipe, CurrencyPipe, DealStatusBadgeComponent, CrmEmptyStateComponent],
  templateUrl: './deal-list.component.html',
  styleUrl: './deal-list.component.scss'
})
export class DealListComponent implements OnInit {

  readonly facade = inject(DealFacade);
  private readonly router = inject(Router);

  readonly loading       = this.facade.listLoading;
  readonly error         = signal<string | null>(null);
  readonly deals         = this.facade.deals;
  readonly totalElements = this.facade.totalElements;
  readonly totalPages    = this.facade.totalPages;

  readonly statuses     = Object.values(DealStatus);
  readonly statusLabels = DEAL_STATUS_LABELS;

  currentPage    = 0;
  readonly pageSize = 20;
  keyword        = '';
  selectedStatus: DealStatus | '' = '';
  overdueOnly    = false;

  ngOnInit(): void { this.load(); }

  load(): void {
    const f: DealFilter = {};
    if (this.keyword.trim()) f.keyword    = this.keyword;
    if (this.selectedStatus) f.status     = this.selectedStatus;
    if (this.overdueOnly)    f.overdueOnly = true;
    this.facade.loadList(f, this.currentPage, this.pageSize);
  }

  onFilterChange(): void { this.currentPage = 0; this.load(); }
  goToPage(page: number): void { this.currentPage = page; this.load(); }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/deals', publicId]); }
  goCreate(): void { this.router.navigate(['/crm/deals/new']); }
}
