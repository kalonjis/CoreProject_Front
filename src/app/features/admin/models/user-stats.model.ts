/**
 * User statistics model for admin dashboard and user management.
 * Contains aggregated metrics about user accounts.
 */
export interface UserStats {
  /** Total number of users in the system */
  totalUsers: number;

  /** Number of active (enabled) users */
  activeUsers: number;

  /** Number of deactivated (disabled) users */
  deactivatedUsers: number;

  /** Number of users with verified email */
  verifiedUsers: number;

  /** Number of users with unverified email */
  unverifiedUsers: number;

  /** Number of users with admin roles (ADMIN or SUPER_ADMIN) */
  adminUsers: number;

  /** Number of regular users (non-admin) */
  regularUsers: number;

  /** Timestamp when stats were generated (ISO 8601 format) */
  timestamp?: string;
}
