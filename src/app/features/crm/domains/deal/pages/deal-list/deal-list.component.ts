import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CrmDealApiService } from '../../services/crm-deal-api.service';
import { DealSummary, DealFilter, DealStatus, DEAL_STATUS_LABELS } from '../../models/deal.model';
import { DealStatusBadgeComponent } from '../../components/deal-status-badge/deal-status-badge.component';
import { CrmEmptyStateComponent } from '../../../../shared/empty-state/crm-empty-state.component';

@Component({
  selector: 'app-deal-list',
  imports: [FormsModule, DatePipe, CurrencyPipe, DealStatusBadgeComponent, CrmEmptyStateComponent],
  templateUrl: './deal-list.component.html',
  styleUrl: './deal-list.component.scss'
})
export class DealListComponent implements OnInit {

  private readonly api    = inject(CrmDealApiService);
  private readonly router = inject(Router);

  readonly deals         = signal<DealSummary[]>([]);
  readonly totalPages    = signal(0);
  readonly totalElements = signal(0);
  readonly loading       = signal(false);
  readonly error         = signal<string | null>(null);

  currentPage = 0;
  readonly pageSize = 20;

  keyword        = '';
  selectedStatus : DealStatus | '' = '';
  overdueOnly    = false;

  readonly statuses     = Object.values(DealStatus);
  readonly statusLabels = DEAL_STATUS_LABELS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const f: DealFilter = {};
    if (this.keyword.trim())   f.keyword    = this.keyword;
    if (this.selectedStatus)   f.status     = this.selectedStatus;
    if (this.overdueOnly)      f.overdueOnly = true;

    this.api.findAll(f, this.currentPage, this.pageSize).subscribe({
      next: page => {
        this.deals.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => { this.error.set('Impossible de charger les deals.'); this.loading.set(false); }
    });
  }

  onFilterChange(): void { this.currentPage = 0; this.load(); }
  goToPage(page: number): void { this.currentPage = page; this.load(); }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/deals', publicId]); }
  goCreate(): void { this.router.navigate(['/crm/deals/new']); }
}
