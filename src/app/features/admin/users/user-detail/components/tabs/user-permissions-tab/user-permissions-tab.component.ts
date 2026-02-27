// src/app/features/admin/users/user-detail/components/tabs/user-permissions-tab/user-permissions-tab.component.ts

import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule }                        from '@angular/common';

import { AdminUser }        from '../../../../models';
import { UserRole }         from '../../../../../../../data/models/user/user-role';
import { AuthFacade }       from '../../../../../../../core/auth/services/auth.facade';
import {AdminUserFacade} from '../../../../services/admin-user-facade.service';

/** Ordered list used for display and iteration — highest authority first. */
const ROLE_ORDER: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MODERATOR,
  UserRole.USER,
  UserRole.GUEST,
];

/** French label for each role. */
const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrateur',
  [UserRole.ADMIN]:       'Administrateur',
  [UserRole.MODERATOR]:   'Modérateur',
  [UserRole.USER]:        'Utilisateur',
  [UserRole.GUEST]:       'Invité',
};

/** Short description shown in the role cards. */
const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Accès complet — gestion des admins, suppressions, GDPR.',
  [UserRole.ADMIN]:       'Gestion des utilisateurs, modération et actions administratives.',
  [UserRole.MODERATOR]:   'Modération des contenus et des interactions utilisateurs.',
  [UserRole.USER]:        'Accès standard aux fonctionnalités de la plateforme.',
  [UserRole.GUEST]:       'Accès limité en lecture seule.',
};

/**
 * "Permissions" tab in the admin user detail view.
 *
 * Displays the target user's current roles as removable cards and lists
 * assignable roles that the acting admin is allowed to grant.
 *
 * Permission rules (mirrors backend enforcement):
 * - Granting / revoking SUPER_ADMIN is always blocked (no UI action).
 * - Granting / revoking ADMIN requires SUPER_ADMIN authority.
 * - Granting / revoking MODERATOR / USER requires at minimum ADMIN authority.
 * - An admin cannot modify their own roles.
 *
 * All mutations are delegated to {@link AdminUserFacade} which reloads
 * the user on success, keeping this component stateless.
 *
 * @example
 * ```html
 * <app-user-permissions-tab [user]="user()!" />
 * ```
 */
@Component({
  selector:    'app-user-permissions-tab',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './user-permissions-tab.component.html',
  styleUrl:    './user-permissions-tab.component.scss',
})
export class UserPermissionsTabComponent {

  @Input({ required: true }) user!: AdminUser;

  // ---------------------------------------------------------------------------
  // Dependencies
  // ---------------------------------------------------------------------------

  protected readonly facade     = inject(AdminUserFacade);
  private   readonly authFacade = inject(AuthFacade);

  // ---------------------------------------------------------------------------
  // Expose constants to template
  // ---------------------------------------------------------------------------

  protected readonly ROLE_ORDER        = ROLE_ORDER;
  protected readonly ROLE_LABELS       = ROLE_LABELS;
  protected readonly ROLE_DESCRIPTIONS = ROLE_DESCRIPTIONS;
  protected readonly UserRole          = UserRole;

  // ---------------------------------------------------------------------------
  // Computed guards
  // ---------------------------------------------------------------------------

  /** True when the acting admin is viewing their own profile. */
  readonly isSelf = computed(() =>
    this.authFacade.username() === this.user.username
  );

  /** True when the acting admin holds the SUPER_ADMIN role. */
  readonly actorIsSuperAdmin = computed(() =>
    this.authFacade.hasRole(UserRole.SUPER_ADMIN)
  );

  /** True when the target user holds the SUPER_ADMIN role. */
  readonly targetIsSuperAdmin = computed(() =>
    this.user.userRoles.includes(UserRole.SUPER_ADMIN)
  );

  /**
   * True when the acting admin can manage roles on this target.
   *
   * False when:
   * - actor is viewing their own account
   * - actor is a plain ADMIN and target is a SUPER_ADMIN
   */
  readonly canManage = computed(() => {
    if (this.isSelf()) return false;
    if (this.targetIsSuperAdmin() && !this.actorIsSuperAdmin()) return false;
    return true;
  });

  // ---------------------------------------------------------------------------
  // Role helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns true when the acting admin can revoke the given role.
   *
   * SUPER_ADMIN role can never be revoked via the UI.
   * ADMIN role requires the actor to be SUPER_ADMIN.
   */
  canRevoke(role: UserRole): boolean {
    if (!this.canManage())              return false;
    if (role === UserRole.SUPER_ADMIN)  return false; // backend would reject too
    if (role === UserRole.ADMIN && !this.actorIsSuperAdmin()) return false;
    return true;
  }

  /**
   * Returns true when the acting admin can grant the given role to this user.
   *
   * SUPER_ADMIN cannot be granted via the UI.
   * ADMIN requires SUPER_ADMIN authority.
   * The user must not already hold the role.
   */
  canGrant(role: UserRole): boolean {
    if (!this.canManage())              return false;
    if (role === UserRole.SUPER_ADMIN)  return false;
    if (role === UserRole.ADMIN && !this.actorIsSuperAdmin()) return false;
    return !this.user.userRoles.includes(role);
  }

  /**
   * Roles that the acting admin may grant to this user
   * (filtered + ordered by authority).
   */
  get grantableRoles(): UserRole[] {
    return ROLE_ORDER.filter(r => this.canGrant(r));
  }

  /** CSS modifier class for a role card/badge. */
  roleClass(role: UserRole): string {
    const map: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'role--super-admin',
      [UserRole.ADMIN]:       'role--admin',
      [UserRole.MODERATOR]:   'role--moderator',
      [UserRole.USER]:        'role--user',
      [UserRole.GUEST]:       'role--guest',
    };
    return map[role] ?? 'role--user';
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  grant(role: UserRole): void {
    if (!this.canGrant(role) || this.facade.isMutating()) return;
    this.facade.grantRole(this.user.publicId, role).subscribe();
  }

  revoke(role: UserRole): void {
    if (!this.canRevoke(role) || this.facade.isMutating()) return;
    this.facade.revokeRole(this.user.publicId, role).subscribe();
  }
}
