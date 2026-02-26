import {AdminDeactivationCategory, DeactivationMainCategory} from './admin-deactivation-category.enum';

/**
 * Generic paginated response wrapper.
 *
 * Mirrors the Spring Data {@code Page<T>} JSON serialization.
 * Used by any endpoint returning a paginated list of items.
 */
export interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  size:          number;
  number:        number;  // zero-based page index
  first:         boolean;
  last:          boolean;
}

/**
 * Generic response returned by all lifecycle and role mutation endpoints.
 *
 * Mirrors the Java record {@code AdminAccountOperationResponse}.
 *
 * Returned by:
 * - POST   /api/admin/users/create
 * - PATCH  /api/admin/users/activate/{publicId}
 * - PATCH  /api/admin/users/reactivate/{publicId}
 * - PATCH  /api/admin/users/deactivate/{publicId}
 * - PATCH  /api/admin/users/grant-role/{publicId}
 * - PATCH  /api/admin/users/revoke-role/{publicId}
 * - DELETE /api/admin/users/delete/{publicId}
 * - DELETE /api/admin/users/gdpr/{publicId}
 */
export interface AdminOperationResponse {
  message: string;
  success: boolean;
}

/**
 * User statistics for the admin dashboard.
 *
 * Mirrors the response of GET /api/admin/users/stats.
 */
export interface AdminUserStats {
  totalUsers:       number;
  activeUsers:      number;
  deactivatedUsers: number;
  verifiedUsers:    number;
  unverifiedUsers:  number;
  adminUsers:       number;
  regularUsers:     number;
  timestamp:        string;
}

/**
 * A single deactivation category item as returned by the backend.
 *
 * Mirrors the response of GET /api/admin/users/deactivation-categories.
 * Used to populate the category picker in the deactivation modal.
 *
 * {@code requiresSuperAdmin} controls whether the option should be
 * visible/enabled for a regular ADMIN (hidden for SUPER_ADMIN-only categories).
 */
export interface DeactivationCategoryItem {
  value:              AdminDeactivationCategory;
  displayName:        string;
  description:        string;
  mainCategory:       DeactivationMainCategory;
  requiresSuperAdmin: boolean;
  allowsReactivation: boolean;
}
