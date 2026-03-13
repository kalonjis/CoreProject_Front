// src/app/features/admin/users/user-detail/components/user-detail-header/user-detail-header.component.ts

import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRole } from '../../../../../../data/models/user/user-role';
import {AdminUser} from '../../../models';

/**
 * User detail header component.
 *
 * Purely presentational — no injected services, no side effects.
 * Displays a profile banner with:
 * - Avatar (initials-based, color-coded by top role)
 * - Display name (firstname + lastname, fallback to username)
 * - Username, email, phone
 * - Active / inactive status badge
 * - Admin-deactivated warning banner (when adminDeactivationReason is set)
 * - Top role badge
 * - Key account flags (2FA, emailVerified, mustChangePassword)
 *
 * @example
 * ```html
 * <app-user-detail-header [user]="user()!" />
 * ```
 */
@Component({
    selector: 'app-user-detail-header',
    imports: [CommonModule],
    templateUrl: './user-detail-header.component.html',
    styleUrl: './user-detail-header.component.scss'
})
export class UserDetailHeaderComponent {

  @Input({ required: true }) user!: AdminUser;

  // Expose enum to template
  protected readonly UserRole = UserRole;

  // ===========================================================================
  // Display helpers
  // ===========================================================================

  /**
   * Returns "Firstname Lastname" when available, falls back to username.
   */
  get displayName(): string {
    const full = [this.user.firstname, this.user.lastname].filter(Boolean).join(' ');
    return full || this.user.username;
  }

  /**
   * Returns the first character of the display name, uppercased.
   * Used as the avatar initials (single letter).
   */
  get avatarInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  /**
   * Returns the highest-authority role from the user's role set.
   * Authority order mirrors the {@link UserRole} enum declaration order.
   */
  get topRole(): UserRole {
    const order = Object.values(UserRole);
    return this.user.userRoles.reduce((top, cur) =>
        order.indexOf(cur) < order.indexOf(top) ? cur : top
      , UserRole.GUEST);
  }

  /**
   * CSS modifier class for the avatar background gradient,
   * color-coded by the user's top role.
   */
  get avatarRoleClass(): string {
    const map: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'avatar--super-admin',
      [UserRole.ADMIN]:       'avatar--admin',
      [UserRole.MODERATOR]:   'avatar--moderator',
      [UserRole.USER]:        'avatar--user',
      [UserRole.GUEST]:       'avatar--guest',
    };
    return map[this.topRole] ?? 'avatar--user';
  }

  /**
   * CSS modifier class for the role badge, reusing the same
   * convention as the user-list component.
   */
  get roleBadgeClass(): string {
    const map: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'role-super-admin',
      [UserRole.ADMIN]:       'role-admin',
      [UserRole.MODERATOR]:   'role-moderator',
      [UserRole.USER]:        'role-user',
      [UserRole.GUEST]:       'role-guest',
    };
    return map[this.topRole] ?? '';
  }

  /**
   * True when the account was deactivated by an admin
   * (as opposed to a self-deactivation or never activated).
   */
  get isAdminDeactivated(): boolean {
    return !this.user.enabled && !!this.user.adminDeactivationReason;
  }

  /**
   * Formats an ISO date string for display in the fr-BE locale.
   * Returns '—' when absent.
   */
  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-BE', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }
}
