import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DealFacade }   from '../../facades/deal.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { DealFilter, DealStatus, DEAL_STATUS_LABELS } from '../../models/deal.model';
import { DealStatusBadgeComponent } from '../../components/deal-status-badge/deal-status-badge.component';
import { CrmEmptyStateComponent }   from '../../../../shared/empty-state/crm-empty-state.component';
import { CrmTagApiService } from '../../../tag/services/crm-tag-api.service';
import { Tag } from '../../../tag/models/tag.model';

@Component({
  selector: 'app-deal-list',
  providers: [DealFacade, InteractionFacade],
  imports: [FormsModule, DatePipe, CurrencyPipe, DealStatusBadgeComponent, CrmEmptyStateComponent],
  templateUrl: './deal-list.component.html',
  styleUrl: './deal-list.component.scss'
})
export class DealListComponent implements OnInit {

  readonly facade  = inject(DealFacade);
  private readonly router  = inject(Router);
  private readonly tagApi  = inject(CrmTagApiService);

  readonly loading       = this.facade.listLoading;
  readonly error         = signal<string | null>(null);
  readonly deals         = this.facade.deals;
  readonly totalElements = this.facade.totalElements;
  readonly totalPages    = this.facade.totalPages;
  readonly allTags       = signal<Tag[]>([]);

  readonly statuses     = Object.values(DealStatus);
  readonly statusLabels = DEAL_STATUS_LABELS;

  currentPage         = 0;
  readonly pageSize   = 20;
  keyword             = '';
  selectedStatus: DealStatus | '' = '';
  overdueOnly         = false;
  selectedTagPublicId = '';

  ngOnInit(): void {
    this.tagApi.findAll().subscribe(tags => this.allTags.set(tags));
    this.load();
  }

  load(): void {
    const f: DealFilter = {};
    if (this.keyword.trim())       f.keyword      = this.keyword;
    if (this.selectedStatus)       f.status        = this.selectedStatus;
    if (this.overdueOnly)          f.overdueOnly   = true;
    if (this.selectedTagPublicId)  f.tagPublicId   = this.selectedTagPublicId;
    this.facade.loadList(f, this.currentPage, this.pageSize);
  }

  onFilterChange(): void { this.currentPage = 0; this.load(); }
  goToPage(page: number): void { this.currentPage = page; this.load(); }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/deals', publicId]); }
  goCreate(): void { this.router.navigate(['/crm/deals/new']); }
}
