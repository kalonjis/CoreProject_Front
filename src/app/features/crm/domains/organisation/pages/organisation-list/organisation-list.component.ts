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

  /** Current page of organisations. */
  readonly organisations = signal<OrganisationSummary[]>([]);
  /** Total number of pages available. */
  readonly totalPages    = signal(0);
  /** Total number of matching organisations. */
  readonly totalElements = signal(0);
  /** Whether a list request is in flight. */
  readonly loading       = signal(false);
  /** Inline error message shown if a load fails. */
  readonly error         = signal<string | null>(null);
  /** All CRM tags available for the tag filter. */
  readonly allTags       = signal<Tag[]>([]);
  /** Controls visibility of the inline create panel. */
  readonly showCreate    = signal(false);

  /** Current page index (0-based). */
  currentPage  = 0;
  /** Free-text keyword filter. */
  keyword      = '';
  /** Size filter value; empty string means no filter. */
  selectedSize:         OrganisationSize   | '' = '';
  /** Status filter value; empty string means no filter. */
  selectedStatus:       OrganisationStatus | '' = '';
  /** Public ID of the selected tag filter; empty string means no filter. */
  selectedTagPublicId   = '';

  /** All possible organisation sizes for the size filter select. */
  readonly sizes        = Object.values(OrganisationSize);
  /** Human-readable labels keyed by OrganisationSize. */
  readonly sizeLabels   = ORGANISATION_SIZE_LABELS;
  /** All possible organisation statuses for the status filter select. */
  readonly statuses     = Object.values(OrganisationStatus);
  /** Human-readable labels keyed by OrganisationStatus. */
  readonly statusLabels = ORGANISATION_STATUS_LABELS;

  /** Currently active sort column name. */
  readonly sortField = signal<string>('name');
  /** Current sort direction for the active column. */
  readonly sortDir   = signal<'asc' | 'desc'>('asc');

  ngOnInit(): void {
    this.keywordSubject.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => { this.currentPage = 0; this.load(); });

    this.tagApi.findAll().subscribe(tags => this.allTags.set(tags));
    this.load();
  }

  /** Builds the active filter object and fetches the current page from the API. */
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

  /** Resets to page 0 and reloads when a select filter changes. */
  onFilterChange(): void { this.currentPage = 0; this.load(); }
  /** Pushes a debounced reload when the keyword input changes. */
  onKeywordChange(): void { this.keywordSubject.next(); }
  /** Navigates to the given page index and reloads. */
  goToPage(page: number): void { this.currentPage = page; this.load(); }

  /** Toggles sort direction if already sorted by this field, otherwise switches to it ascending. */
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

  /** Returns true when the given field is the active sort column. */
  isSorted(field: string): boolean { return this.sortField() === field; }

  /** Extracts the hostname (without www.) from a URL for compact display. */
  domainOf(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch { return url; }
  }

  /** Hides the create panel and navigates to the newly created organisation detail. */
  onOrgCreated(org: OrganisationDetail): void {
    this.showCreate.set(false);
    this.router.navigate(['/crm/organisations', org.publicId]);
  }

  /** Navigates to the detail page for the given organisation. */
  viewDetail(publicId: string): void { this.router.navigate(['/crm/organisations', publicId]); }
  /** Shows the inline organisation creation panel. */
  goCreate(): void { this.showCreate.set(true); }
}
