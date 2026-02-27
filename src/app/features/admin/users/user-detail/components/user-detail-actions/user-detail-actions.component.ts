// src/app/features/admin/users/user-detail/components/user-detail-actions/user-detail-actions.component.ts

import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthFacade } from '../../../../../../core/auth/services/auth.facade';
import {AdminUser, resolveLifecycleAction} from '../../../models';
import {AdminUserFacade} from '../../../services/admin-user-facade.service';

/**
 * Administrative actions panel for a single user.
 *
 * Displayed as a sticky sidebar card in the detail view.
 * Handles all lifecycle mutations except deactivation, which requires
 * a modal form — that case is delegated to the parent container via
 * the {@link deactivateRequested} output.
 *
 * Actions available:
 * - Activate        (everActivated === false)
 * - Reactivate      (everActivated === true && enabled === false)
 * - Deactivate      (enabled === true)  → emits to container, opens modal
 * - Delete          (SUPER_ADMIN only)  → hard delete, irreversible
 * - GDPR anonymise  (SUPER_ADMIN only)  → wipes PII, keeps shell
 *
 * Guards:
 * - All mutating buttons are disabled while {@link AdminUserFacade.isMutating} is true
 * - An admin cannot act on their own account (self-guard)
 * - SUPER_ADMIN-only actions are hidden for regular ADMINs
 * - A SUPER_ADMIN account cannot be deactivated (backend enforces, UI hides)
 *
 * @example
 * ```html
 * <app-user-detail-actions
 *   [user]="user()!"
 *   (deactivateRequested)="openDeactivateModal()"
 *   (userDeleted)="onUserDeleted()" />
 * ```
 */
@Component({
  selector: 'app-user-detail-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail-actions.component.html',
  styleUrl: './user-detail-actions.component.scss',
})
export class UserDetailActionsComponent {

  @Input({ required: true }) user!: AdminUser;

  /**
   * Emitted when the admin clicks "Deactivate".
   * The parent container is responsible for opening the deactivation modal.
   */
  @Output() deactivateRequested = new EventEmitter<void>();

  /**
   * Emitted after a successful hard-delete or GDPR anonymisation.
   * The parent container should navigate away (record no longer exists).
   */
  @Output() userDeleted = new EventEmitter<void>();

  // ===========================================================================
  // Dependencies
  // ===========================================================================

  protected readonly facade    = inject(AdminUserFacade);
  private   readonly authFacade = inject(AuthFacade);

  // ===========================================================================
  // Computed guards
  // ===========================================================================

  /**
   * True when the logged-in admin is viewing their own profile.
   * All mutating actions are disabled in this case.
   */
  readonly isSelf = computed(() =>
    this.authFacade.username() === this.user.username
  );

  /**
   * True when the current admin is a SUPER_ADMIN.
   * Used to show/hide delete and GDPR actions.
   */
  readonly isSuperAdmin = this.facade.isSuperAdmin;

  /**
   * True when any mutation is in progress.
   * Disables all action buttons to prevent double-submit.
   */
  readonly isMutating = this.facade.isMutating;

  /**
   * Resolved lifecycle action for this user.
   * Drives which primary button is displayed.
   */
  get lifecycleAction() {
    return resolveLifecycleAction(this.user);
  }

  /**
   * True when the target user is a SUPER_ADMIN.
   * The deactivate button is hidden in this case (backend also enforces).
   */
  get targetIsSuperAdmin(): boolean {
    return this.user.userRoles.some(r => r === 'SUPER_ADMIN');
  }

  /**
   * True when any action button should be globally disabled.
   */
  get isDisabled(): boolean {
    return this.isSelf() || this.isMutating();
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * First-time activation — called when lifecycleAction === 'activate'.
   */
  onActivate(): void {
    if (this.isDisabled) return;
    this.facade.activateUser(this.user.publicId).subscribe();
  }

  /**
   * Reactivation of a previously deactivated account —
   * called when lifecycleAction === 'reactivate'.
   */
  onReactivate(): void {
    if (this.isDisabled) return;
    this.facade.reactivateUser(this.user.publicId).subscribe();
  }

  /**
   * Emits {@link deactivateRequested} — the parent opens the modal.
   * Called when lifecycleAction === 'deactivate'.
   */
  onDeactivate(): void {
    if (this.isDisabled || this.targetIsSuperAdmin) return;
    this.deactivateRequested.emit();
  }

  /**
   * Permanently deletes the user record (SUPER_ADMIN only).
   * Shows a native confirmation dialog before proceeding.
   * Emits {@link userDeleted} on success so the parent can navigate away.
   */
  onDelete(): void {
    if (this.isDisabled || !this.isSuperAdmin()) return;

    const confirmed = window.confirm(
      `Permanently delete "${this.user.username}"?\n\nThis action is irreversible — all data will be lost.`
    );
    if (!confirmed) return;

    this.facade.deleteUser(this.user.publicId).subscribe({
      next: () => this.userDeleted.emit(),
    });
  }

  /**
   * GDPR anonymisation — wipes all PII, retains the account shell (SUPER_ADMIN only).
   * Shows a native confirmation dialog before proceeding.
   * Emits {@link userDeleted} on success so the parent can navigate away.
   */
  onGdprDelete(): void {
    if (this.isDisabled || !this.isSuperAdmin()) return;

    const confirmed = window.confirm(
      `GDPR anonymise "${this.user.username}"?\n\nAll personal data will be permanently erased. The account shell will be retained.`
    );
    if (!confirmed) return;

    this.facade.gdprDeleteUser(this.user.publicId).subscribe({
      next: () => this.userDeleted.emit(),
    });
  }
}
