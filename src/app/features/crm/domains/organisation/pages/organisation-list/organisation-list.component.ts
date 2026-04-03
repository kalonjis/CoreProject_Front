import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import {
  OrganisationSummary,
  OrganisationFilter,
  OrganisationSize,
  ORGANISATION_SIZE_LABELS,
  OrganisationStatus,
  ORGANISATION_STATUS_LABELS
} from '../../models/organisation.model';
import { OrganisationSizeBadgeComponent } from '../../components/organisation-size-badge/organisation-size-badge.component';
import { OrganisationStatusBadgeComponent } from '../../components/organisation-status-badge/organisation-status-badge.component';
import { CrmEmptyStateComponent } from '../../../../shared/empty-state/crm-empty-state.component';
import { CrmTagApiService } from '../../../tag/services/crm-tag-api.service';
import { Tag } from '../../../tag/models/tag.model';

@Component({
  selector: 'app-organisation-list',
  imports: [FormsModule, OrganisationSizeBadgeComponent, OrganisationStatusBadgeComponent, CrmEmptyStateComponent],
  templateUrl: './organisation-list.component.html',
  styleUrl: './organisation-list.component.scss'
})
export class OrganisationListComponent implements OnInit {

  private readonly api    = inject(CrmOrganisationApiService);
  private readonly router = inject(Router);
  private readonly tagApi = inject(CrmTagApiService);

  readonly organisations  = signal<OrganisationSummary[]>([]);
  readonly totalPages     = signal(0);
  readonly totalElements  = signal(0);
  readonly loading        = signal(false);
  readonly error          = signal<string | null>(null);

  readonly allTags = signal<Tag[]>([]);

  currentPage = 0;
  readonly pageSize = 20;

  keyword               = '';
  selectedSize          : OrganisationSize | ''   = '';
  selectedStatus        : OrganisationStatus | '' = '';
  selectedTagPublicId   = '';

  readonly sizes         = Object.values(OrganisationSize);
  readonly sizeLabels    = ORGANISATION_SIZE_LABELS;
  readonly statuses      = Object.values(OrganisationStatus);
  readonly statusLabels  = ORGANISATION_STATUS_LABELS;

  ngOnInit(): void {
    this.tagApi.findAll().subscribe(tags => this.allTags.set(tags));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const f: OrganisationFilter = {};
    if (this.keyword.trim())       f.keyword      = this.keyword;
    if (this.selectedSize)         f.size         = this.selectedSize;
    if (this.selectedStatus)       f.status       = this.selectedStatus;
    if (this.selectedTagPublicId)  f.tagPublicId  = this.selectedTagPublicId;

    this.api.findAll(f, this.currentPage).subscribe({
      next: page => {
        this.organisations.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => { this.error.set('Impossible de charger les organisations.'); this.loading.set(false); }
    });
  }

  onFilterChange(): void { this.currentPage = 0; this.load(); }
  onKeywordChange(): void { this.currentPage = 0; this.load(); }
  goToPage(page: number): void { this.currentPage = page; this.load(); }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/organisations', publicId]); }
  goCreate(): void { this.router.navigate(['/crm/organisations/new']); }
}
