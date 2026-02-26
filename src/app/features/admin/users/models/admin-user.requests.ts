import {UserRole} from '../../../../data/models/user/user-role';
import {AdminDeactivationCategory} from './admin-deactivation-category.enum';

/**
 * Request body for creating a new user as an administrator.
 *
 * Mirrors the Java record {@code AdminUserCreateRequest}.
 * The backend generates a temporary password and sends it to the user by email.
 *
 * POST /api/admin/users/create
 */
export interface AdminUserCreateRequest {
  firstname:   string;
  lastname:    string;
  email:       string;
  phoneNumber: string | null;
  userRoles:   UserRole[];
}

/**
 * Request body for administratively deactivating a user account.
 *
 * Mirrors the Java record {@code UserDeactivationForm}.
 *
 * Constraints (enforced by the backend):
 * - {@code deactivationCategory} must not be null
 * - {@code adminDeactivationDetails} must be between 10 and 500 characters
 *
 * PATCH /api/admin/users/deactivate/{publicId}
 */
export interface UserDeactivationRequest {
  deactivationCategory:     AdminDeactivationCategory;
  adminDeactivationDetails: string;
}

/**
 * Request body for granting or revoking a role on a user account.
 *
 * Used for both endpoints:
 * - PATCH /api/admin/users/grant-role/{publicId}
 * - PATCH /api/admin/users/revoke-role/{publicId}
 */
export interface AdminRoleChangeRequest {
  role: UserRole;
}
