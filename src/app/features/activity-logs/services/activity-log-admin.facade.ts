// src/app/features/activity-logs/services/activity-log-admin.facade.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { ActivityLogApiService } from './activity-log-api.service';
import { ActivityLog, ActivityLogFilter, ActivityLogPage, ActivityLogStats } from '../models/activity-log.model';

/**
 * Admin facade for the activity-log feature.
 *
 * Single state space shared by both views:
 *  - Global view  (all-logs page)    → loadLogs()
 *  - User-scoped  (user-logs page)   → loadUserLogs(publicUserId)
 *
 * The active mode is tracked via _scopedUserId:
 *  - null  → global mode
 *  - string → scoped to that user
 *
 * Components always read the same signals regardless of the active mode.
 */
@Injectable({ providedIn: 'root' })
export class ActivityLogAdminFacade {

  private readonly api = inject(ActivityLogApiService);

  // ===========================================================================
  // STATE — private signals
  // ===========================================================================

  private readonly _logs           = signal<ActivityLog[]>([]);
  private readonly _totalPages     = signal(0);
  private readonly _totalElements  = signal(0);
  private readonly _currentPage    = signal(0);
  private readonly _pageSize       = signal(20);

  private readonly _filter         = signal<ActivityLogFilter>({});
  private readonly _scopedUserId   = signal<string | null>(null);

  private readonly _stats          = signal<ActivityLogStats | null>(null);
  private readonly _selected       = signal<ActivityLog | null>(null);

  private readonly _loading        = signal(false);
  private readonly _statsLoading   = signal(false);
  private readonly _error          = signal<string | null>(null);

  // ===========================================================================
  // PUBLIC SELECTORS — readonly
  // ===========================================================================

  readonly logs          = this._logs.asReadonly();
  readonly totalPages    = this._totalPages.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly currentPage   = this._currentPage.asReadonly();
  readonly pageSize      = this._pageSize.asReadonly();

  readonly filter        = this._filter.asReadonly();
  readonly scopedUserId  = this._scopedUserId.asReadonly();

  readonly stats         = this._stats.asReadonly();
  readonly selected      = this._selected.asReadonly();

  readonly loading       = this._loading.asReadonly();
  readonly statsLoading  = this._statsLoading.asReadonly();
  readonly error         = this._error.asReadonly();

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly isEmpty = computed(() => !this._loading() && this._logs().length === 0);

  readonly isLastPage = computed(() => this._currentPage() >= this._totalPages() - 1);

  readonly hasActiveFilter = computed(() => {
    const f = this._filter();
    return !!(f.category || f.from || f.to || f.successful != null);
  });

  /** True when scoped to a specific user, false for global view */
  readonly isUserScoped = computed(() => this._scopedUserId() !== null);

  // ===========================================================================
  // ACTIONS — load
  // ===========================================================================

  /**
   * Global mode — loads all logs, resets to page 0.
   */
  loadLogs(filter: ActivityLogFilter = {}): void {
    this._scopedUserId.set(null);
    this._filter.set(filter);
    this._currentPage.set(0);
    this._fetch(filter, 0);
  }

  /**
   * User-scoped mode — loads logs for a specific user, resets to page 0.
   */
  loadUserLogs(publicUserId: string, filter: ActivityLogFilter = {}): void {
    this._scopedUserId.set(publicUserId);
    this._filter.set(filter);
    this._currentPage.set(0);
    this._fetch(filter, 0);
  }

  /**
   * Navigates to a specific page, keeping the current mode and filter.
   */
  goToPage(page: number): void {
    this._currentPage.set(page);
    this._fetch(this._filter(), page);
  }

  // ===========================================================================
  // ACTIONS — stats
  // ===========================================================================

  loadStats(from?: string | null, to?: string | null): void {
    this._statsLoading.set(true);
    this._error.set(null);

    this.api.getStats(from, to).pipe(
      tap(stats => this._stats.set(stats)),
      catchError(err => {
        this._error.set(err?.message ?? 'Failed to load stats');
        return EMPTY;
      }),
      finalize(() => this._statsLoading.set(false))
    ).subscribe();
  }

  // ===========================================================================
  // ACTIONS — filter
  // ===========================================================================

  applyFilter(filter: ActivityLogFilter): void {
    const userId = this._scopedUserId();
    userId ? this.loadUserLogs(userId, filter) : this.loadLogs(filter);
  }

  resetFilter(): void {
    this.applyFilter({});
  }

  // ===========================================================================
  // ACTIONS — detail panel
  // ===========================================================================

  selectLog(log: ActivityLog): void { this._selected.set(log); }
  clearSelection(): void            { this._selected.set(null); }

  // ===========================================================================
  // Private
  // ===========================================================================

  private _fetch(filter: ActivityLogFilter, page: number): void {
    this._loading.set(true);
    this._error.set(null);

    const params = { ...filter, page, size: this._pageSize() };
    const userId = this._scopedUserId();

    const call$ = userId
      ? this.api.getUserLogs(userId, params)
      : this.api.getAllLogs(params);

    call$.pipe(
      tap(res => this._applyPage(res)),
      catchError(err => {
        this._error.set(err?.message ?? 'Failed to load logs');
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
