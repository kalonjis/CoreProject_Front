import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe }           from '@angular/common';
import { Router }                            from '@angular/router';
import { CrmChangeLogApiService }            from '../../services/crm-change-log-api.service';
import { CrmChangeLogEntry, fieldLabel }     from '../../models/crm-change-log.model';

/**
 * Global CRM change log page — shows all recent field changes across all entities,
 * paginated, with links to the corresponding entity detail pages.
 */
@Component({
  selector: 'app-change-log-global',
  imports: [DatePipe, LowerCasePipe],
  templateUrl: './change-log-global.component.html',
  styleUrl:    './change-log-global.component.scss'
})
export class ChangeLogGlobalComponent implements OnInit {

  private readonly api    = inject(CrmChangeLogApiService);
  private readonly router = inject(Router);

  readonly entries       = signal<CrmChangeLogEntry[]>([]);
  readonly loading       = signal(true);
  readonly currentPage   = signal(0);
  readonly totalPages    = signal(0);
  readonly totalElements = signal(0);

  readonly fieldLabel = fieldLabel;

  private readonly PAGE_SIZE = 20;

  ngOnInit(): void {
    this.load(0);
  }

  /** Navigates to the previous page if not on the first page. */
  prevPage(): void {
    if (this.currentPage() > 0) this.load(this.currentPage() - 1);
  }

  /** Navigates to the next page if one exists. */
  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) this.load(this.currentPage() + 1);
  }

  /**
   * Navigates to the entity detail page referenced by the given entry.
   *
   * @param entry the change log entry whose entity to navigate to
   */
  navigateTo(entry: CrmChangeLogEntry): void {
    if (!entry.entityPublicId) return;
    let segment: string;
    switch (entry.entityType) {
      case 'CONTACT':      segment = 'contacts';      break;
      case 'ORGANISATION': segment = 'organisations'; break;
      default:             segment = 'deals';
    }
    this.router.navigate(['/crm', segment, entry.entityPublicId]);
  }

  private load(page: number): void {
    this.loading.set(true);
    this.api.getRecent(page, this.PAGE_SIZE).subscribe({
      next: p => {
        this.entries.set(p.content);
        this.currentPage.set(p.number);
        this.totalPages.set(p.totalPages);
        this.totalElements.set(p.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
