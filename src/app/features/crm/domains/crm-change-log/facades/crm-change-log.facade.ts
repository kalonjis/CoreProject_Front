import { Injectable, inject, signal } from '@angular/core';
import { CrmChangeLogApiService } from '../services/crm-change-log-api.service';
import { FeedbackService }        from '../../../../../shared/feedback/tools/feedback.service';
import { CrmChangeLogEntry, CrmEntityType } from '../models/crm-change-log.model';

/**
 * Facade for the CRM change log feature.
 *
 * Manages paginated loading of field change entries for a single CRM entity.
 * Scoped to the component that declares it in {@code providers} — a new
 * instance is created per detail page, ensuring isolated state.
 */
@Injectable()
export class CrmChangeLogFacade {

  private readonly api      = inject(CrmChangeLogApiService);
  private readonly feedback = inject(FeedbackService);

  /** Page size — fixed at 10 entries per page. */
  private readonly PAGE_SIZE = 10;

  private entityType!: CrmEntityType;
  private entityPublicId!: string;

  // ─── State ────────────────────────────────────────────────────────────────

  private readonly _entries      = signal<CrmChangeLogEntry[]>([]);
  private readonly _loading      = signal(false);
  private readonly _currentPage  = signal(0);
  private readonly _totalPages   = signal(0);
  private readonly _totalElements = signal(0);

  readonly entries       = this._entries.asReadonly();
  readonly loading       = this._loading.asReadonly();
  readonly currentPage   = this._currentPage.asReadonly();
  readonly totalPages    = this._totalPages.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();

  // ─── Public operations ────────────────────────────────────────────────────

  /**
   * Initialises the facade context and loads the first page.
   * Must be called once before any other method.
   *
   * @param entityType     the CRM entity type
   * @param entityPublicId the public identifier of the entity to track
   */
  init(entityType: CrmEntityType, entityPublicId: string): void {
    this.entityType     = entityType;
    this.entityPublicId = entityPublicId;
    this.load(0);
  }

  /**
   * Navigates to the next page if one exists.
   */
  nextPage(): void {
    if (this._currentPage() < this._totalPages() - 1) {
      this.load(this._currentPage() + 1);
    }
  }

  /**
   * Navigates to the previous page if not already on the first page.
   */
  prevPage(): void {
    if (this._currentPage() > 0) {
      this.load(this._currentPage() - 1);
    }
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  /**
   * Fetches the given page from the API and updates state.
   */
  private load(page: number): void {
    this._loading.set(true);
    this.api.getChanges(this.entityType, this.entityPublicId, page, this.PAGE_SIZE).subscribe({
      next: p => {
        this._entries.set(p.content);
        this._currentPage.set(p.number);
        this._totalPages.set(p.totalPages);
        this._totalElements.set(p.totalElements);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.feedback.showError('Chargement de l\'historique des modifications impossible.');
      }
    });
  }
}
