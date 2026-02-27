import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminUser,
  AdminUserCreateRequest,
  UserDeactivationRequest,
  AdminRoleChangeRequest,
  AdminOperationResponse,
  AdminUserStats,
  PageResponse,
  DeactivationCategoryItem,
} from '../models';
import {UserRole} from '../../../../data/models/user/user-role';

const BASE_URL = '/api/admin/users';

/**
 * Service responsible for all HTTP interactions with the admin user endpoints.
 *
 * Each method maps 1-to-1 to a backend endpoint. No business logic lives here —
 * only HTTP concerns (params, URL construction, typed responses).
 *
 * All endpoints require at minimum the {@code ADMIN} authority.
 * Endpoints marked as SUPER_ADMIN only are enforced by the backend;
 * the UI is responsible for hiding/disabling those actions appropriately.
 *
 * Base path: /api/admin/users
 */
@Injectable({ providedIn: 'root' })
export class AdminUserApiService {

  private http = inject(HttpClient);

  // ==========================================================================
  // Search & Query
  // ==========================================================================

  /**
   * Returns a paginated list of all users.
   *
   * GET /api/admin/users/all
   *
   * @param page  Zero-based page index (default: 0)
   * @param size  Number of items per page (default: 20)
   * @param sort  Sort field and direction, e.g. 'id,asc' (default: 'id,asc')
   */
  getAll(page = 0, size = 20, sort = 'id,asc'): Observable<PageResponse<AdminUser>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<PageResponse<AdminUser>>(`${BASE_URL}/all`, { params });
  }

  /**
   * Searches users by a global query across all fields
   * (username, firstname, lastname, email, phone).
   *
   * GET /api/admin/users/search
   *
   * @param query Search term
   * @param page  Zero-based page index (default: 0)
   * @param size  Number of items per page (default: 20)
   */
  search(query: string, page = 0, size = 20): Observable<PageResponse<AdminUser>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<AdminUser>>(`${BASE_URL}/search`, { params });
  }

  /**
   * Searches users by individual field criteria. All fields are optional.
   *
   * GET /api/admin/users/searchbycriteria
   *
   * @param criteria  Object containing any combination of field filters
   * @param page      Zero-based page index (default: 0)
   * @param size      Number of items per page (default: 20)
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
  ): Observable<PageResponse<AdminUser>> {
    let params = new HttpParams().set('page', page).set('size', size);
    Object.entries(criteria).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<PageResponse<AdminUser>>(`${BASE_URL}/searchbycriteria`, { params });
  }

  /**
   * Returns a single user by their public UUID.
   *
   * GET /api/admin/users/{publicId}
   *
   * @param publicId  The user's public UUID
   */
  getByPublicId(publicId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${BASE_URL}/${publicId}`);
  }

  /**
   * Returns aggregated user statistics for the admin dashboard.
   *
   * GET /api/admin/users/stats
   */
  getStats(): Observable<AdminUserStats> {
    return this.http.get<AdminUserStats>(`${BASE_URL}/stats`);
  }

  /**
   * Returns the list of available deactivation categories.
   * Used to populate the category picker in the deactivation modal.
   *
   * GET /api/admin/users/deactivation-categories
   */
  getDeactivationCategories(): Observable<DeactivationCategoryItem[]> {
    return this.http.get<DeactivationCategoryItem[]>(`${BASE_URL}/deactivation-categories`);
  }

  // ==========================================================================
  // Lifecycle — Creation
  // ==========================================================================

  /**
   * Creates a new user account as an administrator.
   * The backend generates and emails a temporary password to the new user.
   *
   * POST /api/admin/users/create
   *
   * @param request  User creation payload
   */
  createUser(request: AdminUserCreateRequest): Observable<AdminOperationResponse> {
    return this.http.post<AdminOperationResponse>(`${BASE_URL}/create`, request);
  }

  // ==========================================================================
  // Lifecycle — Activation
  // ==========================================================================

  /**
   * First-time activation of an account that has never been activated.
   * Use when {@code everActivated === false}.
   *
   * PATCH /api/admin/users/activate/{publicId}
   *
   * @param publicId  The user's public UUID
   */
  activateUser(publicId: string): Observable<AdminOperationResponse> {
    return this.http.patch<AdminOperationResponse>(`${BASE_URL}/activate/${publicId}`, {});
  }

  /**
   * Reactivates a previously deactivated account.
   * Use when {@code everActivated === true && enabled === false}.
   *
   * PATCH /api/admin/users/reactivate/{publicId}
   *
   * @param publicId  The user's public UUID
   */
  reactivateUser(publicId: string): Observable<AdminOperationResponse> {
    return this.http.patch<AdminOperationResponse>(`${BASE_URL}/reactivate/${publicId}`, {});
  }

  // ==========================================================================
  // Lifecycle — Deactivation
  // ==========================================================================

  /**
   * Administratively deactivates a user account.
   * Requires a deactivation category and a justification (10–500 chars).
   *
   * PATCH /api/admin/users/deactivate/{publicId}
   *
   * @param publicId  The user's public UUID
   * @param request   Deactivation payload (category + justification)
   */
  deactivateUser(publicId: string, request: UserDeactivationRequest): Observable<AdminOperationResponse> {
    return this.http.patch<AdminOperationResponse>(`${BASE_URL}/deactivate/${publicId}`, request);
  }

  // ==========================================================================
  // Lifecycle — Deletion (SUPER_ADMIN only)
  // ==========================================================================

  /**
   * Permanently and irreversibly deletes a user account and all associated data.
   * Requires SUPER_ADMIN authority — enforced by the backend.
   *
   * DELETE /api/admin/users/delete/{publicId}
   *
   * @param publicId  The user's public UUID
   */
  deleteUser(publicId: string): Observable<AdminOperationResponse> {
    return this.http.delete<AdminOperationResponse>(`${BASE_URL}/delete/${publicId}`);
  }

  /**
   * Anonymizes a user account in compliance with GDPR regulations.
   * All personally identifiable data is wiped; the account shell is retained.
   * Requires SUPER_ADMIN authority — enforced by the backend.
   *
   * DELETE /api/admin/users/gdpr/{publicId}
   *
   * @param publicId  The user's public UUID
   */
  gdprDeleteUser(publicId: string): Observable<AdminOperationResponse> {
    return this.http.delete<AdminOperationResponse>(`${BASE_URL}/gdpr/${publicId}`);
  }

  // ==========================================================================
  // Role Management
  // ==========================================================================

  /**
   * Grants a role to a user.
   * An ADMIN can only grant MODERATOR and USER roles.
   * Granting ADMIN or SUPER_ADMIN requires SUPER_ADMIN authority.
   *
   * PATCH /api/admin/users/grant-role/{publicId}
   *
   * @param publicId  The user's public UUID
   * @param role      The role to grant
   */
  grantRole(publicId: string, role: UserRole): Observable<AdminOperationResponse> {
    const body: AdminRoleChangeRequest = { role };
    return this.http.patch<AdminOperationResponse>(`${BASE_URL}/grant-role/${publicId}`, body);
  }

  /**
   * Revokes a role from a user.
   * Follows the same permission rules as granting roles.
   *
   * PATCH /api/admin/users/revoke-role/{publicId}
   *
   * @param publicId  The user's public UUID
   * @param role      The role to revoke
   */
  revokeRole(publicId: string, role: UserRole): Observable<AdminOperationResponse> {
    const body: AdminRoleChangeRequest = { role };
    return this.http.patch<AdminOperationResponse>(`${BASE_URL}/revoke-role/${publicId}`, body);
  }
}
