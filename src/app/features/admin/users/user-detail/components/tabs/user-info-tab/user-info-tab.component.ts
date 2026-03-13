// src/app/features/admin/users/user-detail/components/tabs/user-info-tab/user-info-tab.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';

import { AdminUser }                       from '../../../../models';
import { UserRole }                        from '../../../../../../../data/models/user/user-role';
import { AdminDeactivationAuditComponent } from '../admin-deactivation-audit/admin-deactivation-audit.component';

/**
 * "General information" tab in the admin user detail view.
 *
 * Purely presentational — receives the full {@link AdminUser} via @Input,
 * renders a structured info grid and (conditionally) the deactivation audit block.
 *
 * Sections:
 * 1. Identity  — publicId, username, first/last name, email, phone
 * 2. Account   — creation / activation / deactivation dates, roles, device count
 * 3. Security  — email verified, phone verified, 2FA status, forced password change
 * 4. Audit     — {@link AdminDeactivationAuditComponent}, visible only when
 *                {@link AdminUser.adminDeactivationReason} is non-null
 *
 * @example
 * ```html
 * <app-user-info-tab [user]="user()!" />
 * ```
 */
@Component({
    selector: 'app-user-info-tab',
    imports: [CommonModule, AdminDeactivationAuditComponent],
    templateUrl: './user-info-tab.component.html',
    styleUrl: './user-info-tab.component.scss'
})
export class UserInfoTabComponent {

  @Input({ required: true }) user!: AdminUser;

  // Expose enum to template for badge colouring
  protected readonly UserRole = UserRole;

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns "Firstname Lastname" when available, falls back to username.
   */
  get displayName(): string {
    const full = [this.user.firstname, this.user.lastname].filter(Boolean).join(' ');
    return full || this.user.username;
  }

  /**
   * French display labels for each {@link UserRole}.
   */
  readonly roleLabels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Administrateur',
    [UserRole.ADMIN]:       'Administrateur',
    [UserRole.MODERATOR]:   'Modérateur',
    [UserRole.USER]:        'Utilisateur',
    [UserRole.GUEST]:       'Invité',
  };

  /**
   * Returns the CSS modifier class for a role badge.
   * Mirrors the convention used in the user-list component.
   */
  roleBadgeClass(role: UserRole): string {
    const map: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'badge--super-admin',
      [UserRole.ADMIN]:       'badge--admin',
      [UserRole.MODERATOR]:   'badge--moderator',
      [UserRole.USER]:        'badge--user',
      [UserRole.GUEST]:       'badge--guest',
    };
    return map[role] ?? 'badge--user';
  }
}
