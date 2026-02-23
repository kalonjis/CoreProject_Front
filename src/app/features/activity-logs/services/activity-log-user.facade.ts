// src/app/features/activity-logs/services/activity-log-user.facade.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { ActivityLogApiService } from './activity-log-api.service';
import { ActivityLog, ActivityLogFilter, ActivityLogPage } from '../models/activity-log.model';

/**
 * User facade for the activity-log feature.
 *
 * Covers the /me/** endpoints — authenticated user querying their own logs only.
 * Three modes driven by _activeCategory:
 *  - null      → full history   GET /me
 *  - 'AUTH'    → auth history   GET /me/auth
 *  - 'SECURITY'→ security logs  GET /me/security
 *
 * Used by the user's account/profile section, not by admin pages.
 */
@Injectable({ providedIn: 'root' })
export class ActivityLogUserFacade {

  private readonly api = inject(ActivityLogApiService);

  // ===========================================================================
  // STATE — private signals
  // ===========================================================================

  private readonly _logs          = signal<ActivityLog[]>([]);
  private readonly _totalPages    = signal(0);
  private readonly _totalElements = signal(0);
  private readonly _currentPage   = signal(0);
  private readonly _pageSize      = signal(20);

  /** Active category filter — null means full history */
  private readonly _activeCategory = signal<'AUTH' | 'SECURITY' | null>(null);

  /** Date range filter */
  private readonly _from = signal<string | null>(null);
  private readonly _to   = signal<string | null>(null);

  private readonly _selected = signal<ActivityLog | null>(null);

  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);

  // ===========================================================================
  // PUBLIC SELECTORS — readonly
  // ===========================================================================

  readonly logs          = this._logs.asReadonly();
  readonly totalPages    = this._totalPages.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly currentPage   = this._currentPage.asReadonly();
  readonly pageSize      = this._pageSize.asReadonly();

  readonly activeCategory = this._activeCategory.asReadonly();
  readonly from           = this._from.asReadonly();
  readonly to             = this._to.asReadonly();

  readonly selected = this._selected.asReadonly();
  readonly loading  = this._loading.asReadonly();
  readonly error    = this._error.asReadonly();

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly isEmpty   = computed(() => !this._loading() && this._logs().length === 0);
  readonly isLastPage = computed(() => this._currentPage() >= this._totalPages() - 1);

  readonly hasDateFilter = computed(() => !!(this._from() || this._to()));

  // ===========================================================================
  // ACTIONS — load
  // ===========================================================================

  /**
   * Full history — no category filter.
   * GET /api/activity-logs/me
   */
  loadHistory(): void {
    this._activeCategory.set(null);
    this._currentPage.set(0);
    this._fetch(0);
  }

  /**
   * AUTH-category logs, optionally date-filtered.
   * GET /api/activity-logs/me/auth
   */
  loadAuthHistory(from?: string | null, to?: string | null): void {
    this._activeCategory.set('AUTH');
    this._from.set(from ?? null);
    this._to.set(to ?? null);
    this._currentPage.set(0);
    this._fetch(0);
  }

  /**
   * SECURITY-category logs, optionally date-filtered.
   * GET /api/activity-logs/me/security
   */
  loadSecurityHistory(from?: string | null, to?: string | null): void {
    this._activeCategory.set('SECURITY');
    this._from.set(from ?? null);
    this._to.set(to ?? null);
    this._currentPage.set(0);
    this._fetch(0);
  }

  /**
   * Navigates to a specific page, keeping the current mode and date range.
   */
  goToPage(page: number): void {
    this._currentPage.set(page);
    this._fetch(page);
  }

  // ===========================================================================
  // ACTIONS — detail panel
  // ===========================================================================

  selectLog(log: ActivityLog): void { this._selected.set(log); }
  clearSelection(): void            { this._selected.set(null); }

  // ===========================================================================
  // Private
  // ===========================================================================

  private _fetch(page: number): void {
    this._loading.set(true);
    this._error.set(null);

    const category = this._activeCategory();
    const from     = this._from();
    const to       = this._to();
    const size     = this._pageSize();

    const call$ = category === 'AUTH'
      ? this.api.getMyAuthHistory(from, to, page, size)
      : category === 'SECURITY'
        ? this.api.getMySecurityHistory(from, to, page, size)
        : this.api.getMyHistory(page, size);

    call$.pipe(
      tap(res => this._applyPage(res)),
      catchError(err => {
        this._error.set(err?.message ?? 'Failed to load activity history');
        return EMPTY;
      }),
      finalize(() => this._loading.set(false))
    ).subscribe();
  }

  private _applyPage(page: ActivityLogPage): void {
    this._logs.set(page.content);
    this._totalPages.set(page.totalPages);
    this._totalElements.set(page.totalElements);
    this._currentPage.set(page.number);
  }
}
