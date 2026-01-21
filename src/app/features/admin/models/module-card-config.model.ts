// src/app/features/admin/models/module-card-config.model.ts

import { UserRole } from '../../../data/models/user/user-role';

/**
 * Configuration model for admin module cards.
 * Used to define the modules displayed on the admin dashboard.
 */
export interface ModuleCardConfig {
  /** Unique identifier for the module */
  id: string;

  /** Display icon (emoji or icon class) */
  icon: string;

  /** Module title */
  title: string;

  /** Brief description of the module */
  description: string;

  /** Route to navigate to when card is clicked */
  route: string;

  /** Whether the module is currently available */
  enabled: boolean;

  /** Optional badge text (e.g., "New", "Beta") */
  badge?: string;

  /** Optional color theme for the card */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

  /**
   * Minimum role required to see this module.
   * If not specified, module is visible to all admins (ADMIN and SUPER_ADMIN).
   * If specified, only users with this role (or higher) can see the module.
   */
  requiredRole?: UserRole;
}
