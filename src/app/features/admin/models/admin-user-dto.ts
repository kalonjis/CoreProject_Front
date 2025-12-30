import {UserRole} from '../../../data/models/user/user-role';

/**
 * DTO for admin user management operations.
 * Contains all necessary information for administrators to manage users.
 */
export interface AdminUserDTO {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  email: string;
  phoneNumber?: string;
  userRoles: UserRole[];
  enabled: boolean;
  emailVerified: boolean;
  phoneNumberVerified: boolean;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
  deviceCount?: number;
}
