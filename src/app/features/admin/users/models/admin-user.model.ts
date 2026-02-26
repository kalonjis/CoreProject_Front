import {UserRole} from '../../../../data/models/user/user-role';
import {AdminDeactivationCategory} from './admin-deactivation-category.enum';

/**
 * Represents a user as seen by an administrator.
 *
 * Mirrors the Java record {@code AdminUserDTO}. This is the central read model
 * for the entire admin/users feature — used in lists, detail views, and as
 * the base for computing available lifecycle actions.
 *
 * Notes:
 * - {@code everActivated} is not in the current {@code AdminUserDTO} Java record
 *   but is required to resolve the correct lifecycle action. Add it to the
 *   backend DTO if not already present.
 * - All date fields are ISO 8601 strings as returned by the API.
 */
export interface AdminUser {
  publicId:              string;
  username:              string;
  firstname:             string;
  lastname:              string;
  email:                 string;
  phoneNumber:           string | null;
  userRoles:             UserRole[];
  enabled:               boolean;
  everActivated:         boolean;
  emailVerified:         boolean;
  phoneNumberVerified:   boolean;
  mustChangePassword:    boolean;
  twoFactorEnabled:      boolean;
  createdAt:             string;
  activatedAt:           string | null;
  deactivatedAt:         string | null;
  deviceCount:           number | null;

  // Admin deactivation audit fields — null when user is active
  adminDeactivationReason:  AdminDeactivationCategory | null;
  adminDeactivationDetails: string | null;
  adminDeactivatedAt:       string | null;
}

// ---------------------------------------------------------------------------
// Lifecycle helpers
// ---------------------------------------------------------------------------

/**
 * The three possible primary lifecycle actions on a user account.
 * Derived from the combination of {@code enabled} and {@code everActivated}.
 */
export type UserLifecycleAction = 'activate' | 'reactivate' | 'deactivate';

/**
 * Resolves which lifecycle action is available for a given user.
 *
 * Rules (mirrors the backend guard logic):
 * - never activated  → activate   (PATCH /activate/{id})
 * - was active, now disabled → reactivate (PATCH /reactivate/{id})
 * - currently active → deactivate (PATCH /deactivate/{id})
 */
export function resolveLifecycleAction(user: AdminUser): UserLifecycleAction {
  if (!user.everActivated) return 'activate';
  if (!user.enabled)       return 'reactivate';
  return 'deactivate';
}
