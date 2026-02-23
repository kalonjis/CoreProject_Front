// src/app/features/activity-logs/services/activity-log-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ActivityLog, ActivityLogFilter, ActivityLogPage, ActivityLogStats } from '../models/activity-log.model';

/**
 * Raw HTTP service for the activity-log feature.
 *
 * Two families of endpoints:
 *  - /api/activity-logs/me/**        → authenticated user, own logs only
 *  - /api/activity-logs/admin/**     → ADMIN | SUPER_ADMIN, any user or global
 *
 * This service is purely a transport layer — no state, no side effects.
 * State management is handled by ActivityLogAdminFacade / ActivityLogUserFacade.
 */
@Injectable({ providedIn: 'root' })
export class ActivityLogApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/activity-logs';

  // ===========================================================================
  // User-facing — /me/**
  // ===========================================================================

  /**
   * Full activity history of the authenticated user, newest first.
   * GET /api/activity-logs/me
   */
  getMyHistory(page = 0, size = 20): Observable<ActivityLogPage> {
    const params = this.buildPageParams(page, size);
    return this.http.get<ActivityLogPage>(`${this.baseUrl}/me`, { params, withCredentials: true });
  }

  /**
   * AUTH-category logs of the authenticated user.
   * Defaults to last 30 days server-side when no range is provided.
   * GET /api/activity-logs/me/auth
   */
  getMyAuthHistory(from?: string | null, to?: string | null, page = 0, size = 20): Observable<ActivityLogPage> {
    const params = this.buildPageParams(page, size, { from, to });
    return this.http.get<ActivityLogPage>(`${this.baseUrl}/me/auth`, { params, withCredentials: true });
  }

  /**
   * SECURITY-category logs of the authenticated user.
   * Defaults to last 30 days server-side when no range is provided.
   * GET /api/activity-logs/me/security
   */
  getMySecurityHistory(from?: string | null, to?: string | null, page = 0, size = 20): Observable<ActivityLogPage> {
    const params = this.buildPageParams(page, size, { from, to });
    return this.http.get<ActivityLogPage>(`${this.baseUrl}/me/security`, { params, withCredentials: true });
  }

  // ===========================================================================
  // Admin — user-scoped /admin/users/{publicUserId}
  // ===========================================================================

  /**
   * Activity logs for a specific user, with optional filters.
   * GET /api/activity-logs/admin/users/{publicUserId}
   */
  getUserLogs(publicUserId: string, filter: ActivityLogFilter = {}): Observable<ActivityLogPage> {
    const params = this.buildFilterParams(filter);
    return this.http.get<ActivityLogPage>(
      `${this.baseUrl}/admin/users/${publicUserId}`,
      { params, withCredentials: true }
    );
  }

  // ===========================================================================
  // Admin — global /admin/all
  // ===========================================================================

  /**
   * All logs across all users, with optional filters.
   * GET /api/activity-logs/admin/all
   */
  getAllLogs(filter: ActivityLogFilter = {}): Observable<ActivityLogPage> {
    const params = this.buildFilterParams(filter);
    return this.http.get<ActivityLogPage>(
      `${this.baseUrl}/admin/all`,
      { params, withCredentials: true }
    );
  }

  // ===========================================================================
  // Admin — stats /admin/stats
  // ===========================================================================

  /**
   * Log counts grouped by action category, across all users.
   * No date range = entire history.
   * GET /api/activity-logs/admin/stats
   */
  getStats(from?: string | null, to?: string | null): Observable<ActivityLogStats> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<ActivityLogStats>(
      `${this.baseUrl}/admin/stats`,
      { params, withCredentials: true }
    );
  }

  // ===========================================================================
  // Private helpers
  // ===========================================================================

  /**
   * Builds HttpParams for paginated endpoints.
   * Optionally merges a date range.
   */
  private buildPageParams(
    page: number,
    size: number,
    range?: { from?: string | null; to?: string | null }
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'timestamp,desc');

    if (range?.from) params = params.set('from', range.from);
    if (range?.to)   params = params.set('to',   range.to);

    return params;
  }

  /**
   * Builds HttpParams from an ActivityLogFilter.
   * Null / undefined values are silently ignored.
   */
  private buildFilterParams(filter: ActivityLogFilter): HttpParams {
    let params = new HttpParams()
      .set('page',  filter.page  ?? 0)
      .set('size',  filter.size  ?? 20)
      .set('sort', 'timestamp,desc');

    if (filter.category  != null) params = params.set('category',  filter.category);
    if (filter.from      != null) params = params.set('from',       filter.from);
    if (filter.to        != null) params = params.set('to',         filter.to);
    if (filter.successful != null) params = params.set('successful', String(filter.successful));

    return params;
  }
}
