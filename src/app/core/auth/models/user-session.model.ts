import { UserRole } from '../../../data/models/user/user-role';

/**
 * Lightweight user model for authentication context.
 * Contains only the fields needed by the auth store and global UI (navbar, guards, etc.).
 * For full user data (profile, admin), use the User model from data/models/user/.
 *
 * Note: Uses publicId (UUID) instead of internal id for security (prevents enumeration attacks).
 * Maps to: GET /api/auth/session → UserSessionResponse
 */
export interface UserSession {
  publicId: string;
  username: string;
  firstname: string | null;
  lastname: string | null;
  email: string;
  phoneNumber: string | null;
  userRoles: UserRole[];

  // Security flags
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneNumberVerified: boolean;
}
