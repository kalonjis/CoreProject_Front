// src/app/features/admin/users/services/admin-user-facade.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';

import { AdminUserApiService } from '../services/admin-user-api.service';
import { AuthFacade } from '../../../../core/auth/services/auth.facade';
import { UserRole } from '../../../../data/models/user/user-role';

import {
  AdminUser,
  AdminUserCreateRequest,
  AdminOperationResponse,
  AdminUserStats,
  PageResponse,
  DeactivationCategoryItem,
  UserDeactivationRequest,
  resolveLifecycleAction,
  UserLifecycleAction,
} from '../models';

// =============================================================================
// Supporting types
// =============================================================================

/**
 * Snapshot of pagination state used by list views.
 */
export interface AdminUserPagination {
  page:          number;
  size:          number;
  totalPages:    number;
  totalElements: number;
  first:         boolean;
  last:          boolean;
}

// =============================================================================
// Facade
// =============================================================================

/**
 * Facade for the admin/users feature.
 *
 * Centralises all state and side-effects so that components remain thin.
 * Exposes only readonly signals — no component should mutate state directly.
 *
 * Responsibilities:
 * - User list state (pagination, search, loading)
 * - Selected user detail state
 * - Deactivation category catalogue (lazy-loaded once)
 * - All lifecycle mutations (activate / reactivate / deactivate)
 * - Role mutations (grant / revoke)
 * - Deletion (SUPER_ADMIN only)
 * - Dashboard stats
 *
 * Usage:
 * ```ts
 * private facade = inject(AdminUserFacade);
 *
 * ngOnInit() {
 *   this.facade.loadPage();
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminUserFacade {

  private readonly api      = inject(AdminUserApiService);
  private readonly authFacade = inject(AuthFacade);

  // ===========================================================================
  // Private writable state
  // ===========================================================================

  // --- List ---
  private readonly _users          = signal<AdminUser[]>([]);
  private readonly _pagination     = signal<AdminUserPagination>({
    page: 0, size: 20, totalPages: 0, totalElements: 0, first: true, last: true,
  });
  private readonly _isLoadingList  = signal(false);
  private readonly _listError      = signal<string | null>(null);

  // --- Detail ---
  private readonly _selectedUser   = signal<AdminUser | null>(null);
  private readonly _isLoadingUser  = signal(false);
  private readonly _userError      = signal<string | null>(null);

  // --- Mutations ---
  private readonly _isMutating     = signal(false);
  private readonly _mutationError  = signal<string | null>(null);

  // --- Stats ---
  private readonly _stats          = signal<AdminUserStats | null>(null);
  private readonly _isLoadingStats = signal(false);

  // --- Deactivation categories (loaded once, cached) ---
  private readonly _deactivationCategories = signal<DeactivationCategoryItem[]>([]);
  private _categoriesLoaded = false;

  // ===========================================================================
  // Public readonly signals
  // ===========================================================================

  // List
  readonly users          = this._users.asReadonly();
  readonly pagination     = this._pagination.asReadonly();
  readonly isLoadingList  = this._isLoadingList.asReadonly();
  readonly listError      = this._listError.asReadonly();

  // Detail
  readonly selectedUser   = this._selectedUser.asReadonly();
  readonly isLoadingUser  = this._isLoadingUser.asReadonly();
  readonly userError      = this._userError.asReadonly();

  // Mutations
  readonly isMutating     = this._isMutating.asReadonly();
  readonly mutationError  = this._mutationError.asReadonly();

  // Stats
  readonly stats          = this._stats.asReadonly();
  readonly isLoadingStats = this._isLoadingStats.asReadonly();

  // Deactivation categories
  readonly deactivationCategories = this._deactivationCategories.asReadonly();

  // ===========================================================================
  // Computed signals
  // ===========================================================================

  /**
   * Resolves the available lifecycle action for the currently selected user.
   * Returns null when no user is loaded.
   */
  readonly lifecycleAction = computed<UserLifecycleAction | null>(() => {
    const u = this._selectedUser();
    return u ? resolveLifecycleAction(u) : null;
  });

  /**
   * True when the authenticated admin is a SUPER_ADMIN.
   * Used to show/hide SUPER_ADMIN-only actions (delete, GDPR, etc.).
   */
  readonly isSuperAdmin = computed(() => this.authFacade.hasRole(UserRole.SUPER_ADMIN));

  /**
   * Deactivation categories visible to the current admin.
   * SUPER_ADMIN-only categories are hidden for regular ADMINs.
   */
  readonly availableDeactivationCategories = computed(() =>
    this._deactivationCategories().filter(c =>
      this.isSuperAdmin() || !c.requiresSuperAdmin
    )
  );

  // ===========================================================================
  // List operations
  // ===========================================================================

  /**
   * Loads a paginated page of all users.
   *
   * @param page Zero-based page index (default: 0)
   * @param size Items per page (default: 20)
   * @param sort Sort expression, e.g. 'id,asc' (default: 'id,asc')
   */
  loadPage(page = 0, size = 20, sort = 'id,asc'): void {
    this._isLoadingList.set(true);
    this._listError.set(null);

    this.api.getAll(page, size, sort).pipe(
      finalize(() => this._isLoadingList.set(false))
    ).subscribe({
      next:  r => this.applyPageResponse(r),
      error: e => this._listError.set(this.extractMessage(e)),
    });
  }

  /**
   * Searches users by a global query string across all fields.
   *
   * @param query Search term
   * @param page  Zero-based page index (default: 0)
   * @param size  Items per page (default: 20)
   */
  search(query: string, page = 0, size = 20): void {
    this._isLoadingList.set(true);
    this._listError.set(null);

    this.api.search(query, page, size).pipe(
      finalize(() => this._isLoadingList.set(false))
    ).subscribe({
      next:  r => this.applyPageResponse(r),
      error: e => this._listError.set(this.extractMessage(e)),
    });
  }

  /**
   * Searches users by individual field criteria.
   * All fields are optional — unset fields are excluded from the query.
   *
   * @param criteria Object containing any combination of field filters
   * @param page     Zero-based page index (default: 0)
   * @param size     Items per page (default: 20)
   */
  searchByCriteria(
    criteria: {
      username?:    string;
      firstname?:   string;
      lastname?:    string;
      email?:       string;
      phoneNumber?: string;
    },
    page = 0,
    size = 20,
  ): void {
    this._isLoadingList.set(true);
    this._listError.set(null);

    this.api.searchByCriteria(criteria, page, size).pipe(
      finalize(() => this._isLoadingList.set(false))
    ).subscribe({
      next:  r => this.applyPageResponse(r),
      error: e => this._listError.set(this.extractMessage(e)),
    });
  }

  // ===========================================================================
  // Detail operations
  // ===========================================================================

  /**
   * Loads a single user by public UUID and sets it as the selected user.
   *
   * @param publicId The user's public UUID
   */
  loadUser(publicId: string): void {
    this._isLoadingUser.set(true);
    this._userError.set(null);
    this._selectedUser.set(null);

    this.api.getByPublicId(publicId).pipe(
      finalize(() => this._isLoadingUser.set(false))
    ).subscribe({
      next:  u => this._selectedUser.set(u),
      error: e => this._userError.set(this.extractMessage(e)),
    });
  }

  /** Clears the currently selected user (e.g. on navigation away). */
  clearSelectedUser(): void {
    this._selectedUser.set(null);
    this._userError.set(null);
    this._mutationError.set(null);
  }

  // ===========================================================================
  // Lifecycle mutations
  // ===========================================================================

  /**
   * First-time activation of an admin-created account (everActivated === false).
   *
   * Reloads the selected user on success.
   *
   * @param publicId Target user's public UUID
   * @returns Observable that completes after the mutation
   */
  activateUser(publicId: string): Observable<AdminOperationResponse> {
    return this.mutate(this.api.activateUser(publicId), publicId);
  }

  /**
   * Reactivation of a previously deactivated account
   * (everActivated === true && enabled === false).
   *
   * Reloads the selected user on success.
   *
   * @param publicId Target user's public UUID
   */
  reactivateUser(publicId: string): Observable<AdminOperationResponse> {
    return this.mutate(this.api.reactivateUser(publicId), publicId);
  }

  /**
   * Administrative deactivation of an active account.
   * Requires a category and a mandatory justification (10–500 chars).
   *
   * Reloads the selected user on success.
   *
   * @param publicId Target user's public UUID
   * @param request  Deactivation payload
   */
  deactivateUser(publicId: string, request: UserDeactivationRequest): Observable<AdminOperationResponse> {
    return this.mutate(this.api.deactivateUser(publicId, request), publicId);
  }

  // ===========================================================================
  // Deletion (SUPER_ADMIN only)
  // ===========================================================================

  /**
   * Permanently deletes a user and all associated data. Irreversible.
   * Backend enforces SUPER_ADMIN authority.
   *
   * Clears the selected user on success (record no longer exists).
   *
   * @param publicId Target user's public UUID
   */
  deleteUser(publicId: string): Observable<AdminOperationResponse> {
    return this.mutate(this.api.deleteUser(publicId), null);
  }

  /**
   * GDPR anonymization: wipes all PII while retaining the account shell.
   * Backend enforces SUPER_ADMIN authority.
   *
   * Reloads the selected user on success (to reflect anonymised state).
   *
   * @param publicId Target user's public UUID
   */
  gdprDeleteUser(publicId: string): Observable<AdminOperationResponse> {
    return this.mutate(this.api.gdprDeleteUser(publicId), publicId);
  }

  // ===========================================================================
  // Role management
  // ===========================================================================

  /**
   * Grants a role to a user and reloads the detail view.
   *
   * Permission rules (enforced by backend):
   * - ADMIN can grant MODERATOR and USER only
   * - Granting ADMIN / SUPER_ADMIN requires SUPER_ADMIN authority
   *
   * @param publicId Target user's public UUID
   * @param role     Role to grant
   */
  grantRole(publicId: string, role: UserRole): Observable<AdminOperationResponse> {
    return this.mutate(this.api.grantRole(publicId, role), publicId);
  }

  /**
   * Revokes a role from a user and reloads the detail view.
   * Follows the same permission rules as granting.
   *
   * @param publicId Target user's public UUID
   * @param role     Role to revoke
   */
  revokeRole(publicId: string, role: UserRole): Observable<AdminOperationResponse> {
    return this.mutate(this.api.revokeRole(publicId, role), publicId);
  }

  // ===========================================================================
  // Stats
  // ===========================================================================

  /**
   * Loads global user statistics for the admin dashboard.
   * Results are cached in the {@code stats} signal.
   */
  loadStats(): void {
    this._isLoadingStats.set(true);

    this.api.getStats().pipe(
      finalize(() => this._isLoadingStats.set(false))
    ).subscribe({
      next:  s => this._stats.set(s),
      error: () => { /* stats are non-critical — silently ignore */ },
    });
  }

  // ===========================================================================
  // Deactivation categories
  // ===========================================================================

  /**
   * Loads the deactivation category catalogue from the backend.
   * Called lazily — subsequent calls are no-ops if already loaded.
   *
   * The catalogue is filtered at display time via
   * {@link availableDeactivationCategories} based on admin role.
   */
  loadDeactivationCategories(): void {
    if (this._categoriesLoaded) return;

    this.api.getDeactivationCategories().pipe(
      tap(() => this._categoriesLoaded = true)
    ).subscribe({
      next:  cats => this._deactivationCategories.set(cats),
      error: ()   => { /* non-critical — modal will handle empty state */ },
    });
  }

  /** Resets the cached categories flag (e.g. for testing). */
  resetCategoriesCache(): void {
    this._categoriesLoaded = false;
    this._deactivationCategories.set([]);
  }

  // ===========================================================================
  // Mutation error management
  // ===========================================================================

  /** Clears the last mutation error signal (e.g. when user dismisses an alert). */
  clearMutationError(): void {
    this._mutationError.set(null);
  }

  // ===========================================================================
  // Private helpers
  // ===========================================================================

  /**
   * Generic mutation wrapper.
   *
   * - Sets `isMutating` flag for the duration of the call
   * - On success: reloads the user detail if `reloadPublicId` is provided,
   *   or clears the selected user when `reloadPublicId` is null (deletion case)
   * - On error: stores the message in `mutationError` and re-throws so that
   *   the calling component can react (e.g. close a modal)
   *
   * @param source$        Source observable from the API service
   * @param reloadPublicId PublicId to reload after success, or null to clear
   */
  private mutate(
    source$: Observable<AdminOperationResponse>,
    reloadPublicId: string | null
  ): Observable<AdminOperationResponse> {
    this._isMutating.set(true);
    this._mutationError.set(null);

    return source$.pipe(
      tap(() => {
        if (reloadPublicId) {
          this.loadUser(reloadPublicId);
        } else {
          this.clearSelectedUser();
        }
      }),
      catchError(e => {
        this._mutationError.set(this.extractMessage(e));
        return throwError(() => e);
      }),
      finalize(() => this._isMutating.set(false))
    );
  }

  /**
   * Applies a paginated API response to the list and pagination signals.
   */
  private applyPageResponse(r: PageResponse<AdminUser>): void {
    this._users.set(r.content);
    this._pagination.set({
      page:          r.number,
      size:          r.size,
      totalPages:    r.totalPages,
      totalElements: r.totalElements,
      first:         r.first,
      last:          r.last,
    });
  }

  /**
   * Extracts a human-readable error message from an HTTP error response.
   * Falls back to a generic message when the response body is unparseable.
   */
  private extractMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const body = (err as any).error;
      if (typeof body?.message === 'string') return body.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
