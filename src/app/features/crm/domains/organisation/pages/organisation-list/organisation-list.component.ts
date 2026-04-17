import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import {
  OrganisationSummary,
  OrganisationFilter,
  OrganisationSize,
  ORGANISATION_SIZE_LABELS,
  OrganisationStatus,
  ORGANISATION_STATUS_LABELS
} from '../../models/organisation.model';
import { OrganisationSizeBadgeComponent }   from '../../components/organisation-size-badge/organisation-size-badge.component';
import { OrganisationStatusBadgeComponent } from '../../components/organisation-status-badge/organisation-status-badge.component';
import { CrmEmptyStateComponent }           from '../../../../shared/empty-state/crm-empty-state.component';
import { CrmTagApiService } from '../../../tag/services/crm-tag-api.service';
import { Tag } from '../../../tag/models/tag.model';
import { OrganisationActionCreateComponent } from '../../components/organisation-action-create/organisation-action-create.component';
import { OrganisationDetail } from '../../models/organisation.model';

@Component({
  selector: 'app-organisation-list',
  imports: [FormsModule, OrganisationSizeBadgeComponent, OrganisationStatusBadgeComponent, CrmEmptyStateComponent, OrganisationActionCreateComponent],
  templateUrl: './organisation-list.component.html',
  styleUrl: './organisation-list.component.scss'
})
/**
 * Paginated organisation list page with keyword search, size/status/tag filters,
 * sortable columns, and inline organisation creation.
 */
export class OrganisationListComponent implements OnInit {

  private readonly api        = inject(CrmOrganisationApiService);
  private readonly router     = inject(Router);
  private readonly tagApi     = inject(CrmTagApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly keywordSubject = new Subject<void>();

  readonly organisations = signal<OrganisationSummary[]>([]);
  readonly totalPages    = signal(0);
  readonly totalElements = signal(0);
  readonly loading       = signal(false);
  readonly error         = signal<string | null>(null);
  readonly allTags       = signal<Tag[]>([]);
  readonly showCreate    = signal(false);

  currentPage  = 0;
  keyword      = '';
  selectedSize:         OrganisationSize   | '' = '';
  selectedStatus:       OrganisationStatus | '' = '';
  selectedTagPublicId   = '';

  readonly sizes        = Object.values(OrganisationSize);
  readonly sizeLabels   = ORGANISATION_SIZE_LABELS;
  readonly statuses     = Object.values(OrganisationStatus);
  readonly statusLabels = ORGANISATION_STATUS_LABELS;

  readonly sortField = signal<string>('name');
  readonly sortDir   = signal<'asc' | 'desc'>('asc');

  ngOnInit(): void {
    this.keywordSubject.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => { this.currentPage = 0; this.load(); });

    this.tagApi.findAll().subscribe(tags => this.allTags.set(tags));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const f: OrganisationFilter = {};
    if (this.keyword.trim())      f.keyword     = this.keyword;
    if (this.selectedSize)        f.size        = this.selectedSize;
    if (this.selectedStatus)      f.status      = this.selectedStatus;
    if (this.selectedTagPublicId) f.tagPublicId = this.selectedTagPublicId;

    this.api.findAll(f, this.currentPage, this.sortField(), this.sortDir()).subscribe({
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
  onKeywordChange(): void { this.keywordSubject.next(); }
  goToPage(page: number): void { this.currentPage = page; this.load(); }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.currentPage = 0;
    this.load();
  }

  isSorted(field: string): boolean { return this.sortField() === field; }

  domainOf(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch { return url; }
  }

  onOrgCreated(org: OrganisationDetail): void {
    this.showCreate.set(false);
    this.router.navigate(['/crm/organisations', org.publicId]);
  }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/organisations', publicId]); }
  goCreate(): void { this.showCreate.set(true); }
}
