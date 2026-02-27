// src/app/features/admin/users/user-detail/user-detail-container.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { UserDetailHeaderComponent } from './components/user-detail-header/user-detail-header.component';
import { UserDetailActionsComponent } from './components/user-detail-actions/user-detail-actions.component';
import { UserInfoTabComponent } from './components/tabs/user-info-tab/user-info-tab.component';
import { UserDevicesTabComponent } from './components/tabs/user-devices-tab/user-devices-tab.component';
import { UserPermissionsTabComponent } from './components/tabs/user-permissions-tab/user-permissions-tab.component';
import { AdminDeactivateModalComponent } from './components/admin-deactivate-modal/admin-deactivate-modal.component';
import { UserLogsComponent } from '../../../../features/activity-logs';
import {AdminUserFacade} from '../../services/admin-user-facade.service';

// =============================================================================
// Types
// =============================================================================

/** Tabs available in the user detail view. */
export type UserDetailTab = 'info' | 'devices' | 'activity' | 'permissions';

const VALID_TABS: UserDetailTab[] = ['info', 'devices', 'activity', 'permissions'];

// =============================================================================
// Component
// =============================================================================

/**
 * Shell container for the admin user detail feature.
 *
 * Responsibilities (this component only):
 * - Reads `publicId` from the route and delegates loading to {@link AdminUserFacade}
 * - Manages the active tab state (synced with `?tab=` query param)
 * - Controls the deactivation modal visibility
 * - Navigates to the user list after a successful deletion
 * - Clears the selected user from the facade on destroy
 *
 * Everything else (display, mutations) is delegated to child components:
 * - {@link UserDetailHeaderComponent}     — user avatar + status banner
 * - {@link UserDetailActionsComponent}    — lifecycle action buttons + delete
 * - {@link UserInfoTabComponent}          — general info + deactivation audit
 * - {@link UserDevicesTabComponent}       — device table + side panel
 * - {@link UserPermissionsTabComponent}   — role grant / revoke
 * - {@link UserLogsComponent}             — activity log (existing shared component)
 * - {@link AdminDeactivateModalComponent} — deactivation modal (opened from actions)
 */
@Component({
  selector: 'app-user-detail-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UserDetailHeaderComponent,
    UserDetailActionsComponent,
    UserInfoTabComponent,
    UserDevicesTabComponent,
    UserPermissionsTabComponent,
    AdminDeactivateModalComponent,
    UserLogsComponent,
  ],
  templateUrl: './user-detail-container.component.html',
  styleUrl: './user-detail-container.component.scss',
})
export class UserDetailContainerComponent implements OnInit, OnDestroy {

  // ===========================================================================
  // Dependencies
  // ===========================================================================

  protected readonly facade = inject(AdminUserFacade);
  private  readonly route  = inject(ActivatedRoute);
  private  readonly router = inject(Router);

  // ===========================================================================
  // Facade signals (passed down to children via @Input or used in template)
  // ===========================================================================

  readonly user          = this.facade.selectedUser;
  readonly isLoading     = this.facade.isLoadingUser;
  readonly userError     = this.facade.userError;
  readonly isMutating    = this.facade.isMutating;
  readonly mutationError = this.facade.mutationError;
  readonly isSuperAdmin  = this.facade.isSuperAdmin;

  // ===========================================================================
  // Local UI state
  // ===========================================================================

  /** Public UUID extracted from the route — stored for the "retry" button. */
  readonly publicId = signal<string | null>(null);

  /** Currently active tab. */
  readonly activeTab = signal<UserDetailTab>('info');

  /** Controls the visibility of the admin deactivation modal. */
  readonly showDeactivateModal = signal(false);

  // ===========================================================================
  // Computed
  // ===========================================================================

  /**
   * True when the user loaded successfully and is ready to display.
   * Used to gate all child components in the template.
   */
  readonly isReady = computed(() => !this.isLoading() && !!this.user());

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  ngOnInit(): void {
    // Read publicId from route params and trigger load
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.publicId.set(id);
        this.facade.loadUser(id);
      }
    });

    // Restore active tab from query params (e.g. deep-link or back navigation)
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab') as UserDetailTab | null;
      if (tab && VALID_TABS.includes(tab)) {
        this.activeTab.set(tab);
      }
    });
  }

  ngOnDestroy(): void {
    this.facade.clearSelectedUser();
  }

  // ===========================================================================
  // Tab navigation
  // ===========================================================================

  /**
   * Switches to the given tab and updates the `?tab=` query param
   * without adding a new browser history entry.
   *
   * @param tab Target tab identifier
   */
  setActiveTab(tab: UserDetailTab): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // ===========================================================================
  // Deactivation modal
  // ===========================================================================

  /** Opens the admin deactivation modal. */
  openDeactivateModal(): void {
    this.showDeactivateModal.set(true);
  }

  /**
   * Called when the modal emits `confirmed`.
   * The facade has already reloaded the user at this point.
   */
  onDeactivationConfirmed(): void {
    this.showDeactivateModal.set(false);
  }

  /** Called when the modal emits `cancelled`. */
  onDeactivationCancelled(): void {
    this.showDeactivateModal.set(false);
  }

  // ===========================================================================
  // Deletion callback
  // ===========================================================================

  /**
   * Called by {@link UserDetailActionsComponent} after a successful deletion.
   * The user record no longer exists — navigate back to the list.
   */
  onUserDeleted(): void {
    this.router.navigate(['/admin/users/list']);
  }

  // ===========================================================================
  // Retry
  // ===========================================================================

  /** Retries loading the user when an error occurred. */
  retry(): void {
    const id = this.publicId();
    if (id) this.facade.loadUser(id);
  }
}
