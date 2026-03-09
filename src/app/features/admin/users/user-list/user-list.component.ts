// src/app/features/admin/users/user-list/user-list.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { UserRole } from '../../../../data/models/user/user-role';
import { AdminUserFacade } from '../services/admin-user-facade.service';
import { AdminUser } from '../models';

/**
 * User list component for the admin section.
 *
 * Displays a paginated, searchable table of all platform users.
 * Delegates all state and HTTP concerns to {@link AdminUserFacade}.
 *
 * Features:
 * - Simple full-text search (username, email, firstname, lastname, phone)
 * - Advanced criteria search (per-field filters, collapsible)
 * - Pagination with configurable page size
 * - Role badge display with hierarchy-aware top-role resolution
 * - Active / inactive status indicator
 *
 * Navigation:
 * - Row click → /admin/users/:publicId (detail view)
 * - "New user" button → /admin/users/new
 */
@Component({
    selector: 'app-user-list',
    imports: [CommonModule, RouterLink, ReactiveFormsModule, FeedbackComponent],
    templateUrl: './user-list.component.html',
    styleUrl: './user-list.component.scss'
})
export class UserListComponent extends FeedbackBase implements OnInit {

  // ===========================================================================
  // Dependencies
  // ===========================================================================

  protected readonly facade = inject(AdminUserFacade);
  private readonly fb     = inject(FormBuilder);

  // ===========================================================================
  // Facade signals (exposed to template)
  // ===========================================================================

  readonly users      = this.facade.users;
  readonly pagination = this.facade.pagination;
  readonly isLoading  = this.facade.isLoadingList;
  readonly listError  = this.facade.listError;

  // ===========================================================================
  // Local UI state
  // ===========================================================================

  readonly showAdvancedSearch = signal(false);

  searchForm: FormGroup = this.fb.group({
    searchQuery: [''],
    username:    [''],
    firstname:   [''],
    lastname:    [''],
    email:       [''],
    phoneNumber: [''],
  });

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  ngOnInit(): void {
    this.facade.loadPage();
  }

  // ===========================================================================
  // Search
  // ===========================================================================

  /**
   * Runs a full-text search across all user fields.
   * Falls back to loading the full list when the query is empty.
   */
  searchUsers(): void {
    const query = this.searchForm.get('searchQuery')?.value?.trim();
    if (!query) {
      this.facade.loadPage();
      return;
    }
    this.facade.search(query);
  }

  /**
   * Runs a field-by-field criteria search.
   * Falls back to loading the full list when all criteria are empty.
   */
  advancedSearch(): void {
    const criteria = {
      username:    this.searchForm.get('username')?.value?.trim() || undefined,
      firstname:   this.searchForm.get('firstname')?.value?.trim() || undefined,
      lastname:    this.searchForm.get('lastname')?.value?.trim() || undefined,
      email:       this.searchForm.get('email')?.value?.trim() || undefined,
      phoneNumber: this.searchForm.get('phoneNumber')?.value?.trim() || undefined,
    };

    const hasAnyCriteria = Object.values(criteria).some(Boolean);
    if (!hasAnyCriteria) {
      this.facade.loadPage();
      return;
    }

    this.facade.searchByCriteria(criteria);
  }

  /** Resets the entire search form and reloads the full user list. */
  resetSearch(): void {
    this.searchForm.reset();
    this.facade.loadPage();
  }

  // ===========================================================================
  // Pagination
  // ===========================================================================

  /**
   * Navigates to the given page index.
   * Guards against out-of-range values.
   *
   * @param page Zero-based target page index
   */
  changePage(page: number): void {
    const { totalPages, size } = this.pagination();
    if (page < 0 || page >= totalPages) return;
    this.facade.loadPage(page, size);
  }

  // ===========================================================================
  // Advanced search toggle
  // ===========================================================================

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch.update(v => !v);

    if (!this.showAdvancedSearch()) {
      this.searchForm.patchValue({
        username: '', firstname: '', lastname: '', email: '', phoneNumber: '',
      });
    }
  }

  // ===========================================================================
  // Display helpers
  // ===========================================================================

  /**
   * Maps a {@link UserRole} to its CSS modifier class for the role badge.
   *
   * @param role Role value
   */
  getRoleClass(role: UserRole): string {
    const map: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'role-super-admin',
      [UserRole.ADMIN]:       'role-admin',
      [UserRole.MODERATOR]:   'role-moderator',
      [UserRole.USER]:        'role-user',
      [UserRole.GUEST]:       'role-guest',
    };
    return map[role] ?? '';
  }

  /**
   * Returns the highest-authority role from a set of roles.
   * Authority order mirrors the {@link UserRole} enum declaration.
   *
   * @param roles Set of roles assigned to a user
   */
  getTopRole(roles: UserRole[]): UserRole {
    const order = Object.values(UserRole);
    return roles.reduce((top, cur) =>
        order.indexOf(cur) < order.indexOf(top) ? cur : top
      , UserRole.GUEST);
  }

  /**
   * Formats an ISO date string for display in the fr-BE locale.
   * Returns '—' when the value is absent.
   *
   * @param date ISO 8601 string or null/undefined
   */
  formatDate(date?: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-BE', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  /**
   * Builds a display name from a user record.
   * Falls back to the username when firstname/lastname are not set.
   *
   * @param user AdminUser record
   */
  getDisplayName(user: AdminUser): string {
    const full = [user.firstname, user.lastname].filter(Boolean).join(' ');
    return full || user.username;
  }
}
