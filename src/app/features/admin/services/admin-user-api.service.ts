import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from '../../../data/models/user/user-dto';
import { UserRole } from '../../../data/models/user/user-role';
import { UserRegisterForm } from '../../../data/models/admin/user-register-form';
import { HttpUtilService } from '../../../core/http/http-util.service';

/**
 * API service for admin user management operations.
 * Handles all HTTP calls related to user CRUD, roles, activation, and history.
 *
 * Endpoints:
 * - User queries: /api/admin/users/*
 * - User management: /api/admin/users/{id}/*
 */
@Injectable({
  providedIn: 'root'
})
export class AdminUserApiService {
  private http = inject(HttpClient);
  private httpUtil = inject(HttpUtilService);

  // Default pagination
  private defaultPage = 0;
  private defaultSize = 20;

  // =========================================================================
  // USER QUERIES
  // =========================================================================

  /**
   * Retrieves paginated list of all users.
   *
   * @param page Page number (default: 0)
   * @param size Page size (default: 20)
   * @param sort Sort criteria (default: 'id,asc')
   * @returns Observable of paginated user list
   */
  getAllUsers(page = this.defaultPage, size = this.defaultSize, sort = 'id,asc'): Observable<any> {
    return this.http.get<any>(`/api/admin/users/all?page=${page}&size=${size}&sort=${sort}`);
  }

  /**
   * Searches users by a global search term.
   * Searches across: username, firstname, lastname, email, phone number.
   *
   * @param query Search query string
   * @param page Page number (default: 0)
   * @param size Page size (default: 20)
   * @returns Observable of paginated search results
   */
  searchUsers(query: string, page = this.defaultPage, size = this.defaultSize): Observable<any> {
    return this.http.get<any>(`/api/admin/users/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  }

  /**
   * Searches users by specific criteria with individual field filters.
   * All parameters are optional and can be combined.
   *
   * @param criteria Object containing search criteria
   * @param page Page number (default: 0)
   * @param size Page size (default: 20)
   * @returns Observable of paginated search results
   */
  searchUsersByCriteria(criteria: {
    username?: string,
    firstname?: string,
    lastname?: string,
    email?: string,
    phoneNumber?: string
  }, page = this.defaultPage, size = this.defaultSize): Observable<any> {
    // Build URL with non-empty parameters
    const params = Object.entries(criteria)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
      .join('&');

    return this.http.get<any>(
      `/api/admin/users/searchbycriteria?${params}&page=${page}&size=${size}`
    );
  }

  /**
   * Retrieves a specific user by ID.
   *
   * @param id User ID
   * @returns Observable of user DTO
   */
  getUserById(id: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`/api/admin/users/${id}`);
  }

  // =========================================================================
  // USER MANAGEMENT
  // =========================================================================

  /**
   * Creates a new user (by administrator).
   *
   * @param user User registration form data
   * @returns Observable of creation response
   */
  createUser(user: UserRegisterForm): Observable<any> {
    return this.httpUtil.post<any>('/api/admin/users', user);
  }

  /**
   * Deletes a user account.
   *
   * @param id User ID to delete
   * @returns Observable of void
   */
  deleteUser(id: number): Observable<void> {
    return this.httpUtil.delete<void>(`/api/admin/users/${id}`);
  }

  /**
   * Activates a user account.
   *
   * @param id User ID to activate
   * @returns Observable of void
   */
  activateUser(id: number): Observable<void> {
    return this.httpUtil.patch<void>(`/api/admin/users/activate/${id}`, {});
  }

  /**
   * Deactivates a user account.
   *
   * @param id User ID to deactivate
   * @returns Observable of void
   */
  deactivateUser(id: number): Observable<void> {
    return this.httpUtil.patch<void>(`/api/admin/users/deactivate/${id}`, {});
  }

  // =========================================================================
  // ROLE MANAGEMENT
  // =========================================================================

  /**
   * Grants a role to a user.
   *
   * @param id User ID
   * @param role Role to grant
   * @returns Observable of void
   */
  grantUserRole(id: number, role: UserRole): Observable<void> {
    return this.httpUtil.patch<void>(`/api/admin/users/grant-role/${id}`, { userRole: role });
  }

  /**
   * Revokes a role from a user.
   *
   * @param id User ID
   * @param role Role to revoke
   * @returns Observable of void
   */
  revokeUserRole(id: number, role: UserRole): Observable<void> {
    return this.httpUtil.patch<void>(`/api/admin/users/revoke-role/${id}`, { userRole: role });
  }

  // =========================================================================
  // PASSWORD MANAGEMENT
  // =========================================================================

  /**
   * Forces a password reset for a user.
   * Triggers password reset email.
   *
   * @param id User ID
   * @returns Observable of void
   */
  forceResetPassword(id: number): Observable<void> {
    return this.httpUtil.patch<void>(`/api/admin/users/force-reset-password/${id}`, {});
  }

  /**
   * Requests password reset via email.
   *
   * @param email User email
   * @returns Observable of response
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.httpUtil.post<any>('/api/password/request-password-reset', { email }, true);
  }

  // =========================================================================
  // ACTIVITY & HISTORY
  // =========================================================================

  /**
   * Retrieves user activity history with pagination.
   *
   * @param userId User ID
   * @param page Page number (default: 0)
   * @param size Page size (default: 10)
   * @returns Observable of paginated activity logs
   */
  getUserActivityHistory(userId: number, page = 0, size = 10): Observable<any> {
    return this.http.get<any>(`/api/security/logs/user/${userId}?page=${page}&size=${size}`);
  }

  /**
   * Retrieves specific user actions filtered by type.
   *
   * @param userId User ID
   * @param types Array of action types to filter
   * @param page Page number (default: 0)
   * @param size Page size (default: 10)
   * @returns Observable of paginated filtered logs
   */
  getUserSpecificActions(userId: number, types: string[], page = 0, size = 10): Observable<any> {
    const typesParam = types.join(',');
    return this.http.get<any>(`/api/security/logs/user/${userId}/actions?types=${typesParam}&page=${page}&size=${size}`);
  }
}
