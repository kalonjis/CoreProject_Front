import { Injectable, computed, signal } from '@angular/core';
import { AuthState, initialAuthState } from '../models/auth.state';
import { UserSession } from '../models/user-session.model';
import { UserRole } from '../../../data/models/user/user-role';

/**
 * AuthStore - Signal-based state management for authentication.
 *
 * Responsibilities:
 * - Hold authentication state (signals)
 * - Provide computed values (derived state)
 * - Expose mutations to modify state
 *
 * Does NOT handle:
 * - HTTP calls (see AuthApiService)
 * - Side effects like navigation (see AuthFacade)
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {

  // =========================================================================
  // STATE (private)
  // =========================================================================

  private readonly _state = signal<AuthState>(initialAuthState);

  // =========================================================================
  // SELECTORS (public readonly)
  // =========================================================================

  /** Full state (readonly) */
  readonly state = this._state.asReadonly();

  /** Current user session */
  readonly user = computed(() => this._state().user);

  /** True if user is authenticated */
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);

  /** True after initial auth check completes */
  readonly isInitialized = computed(() => this._state().isInitialized);

  /** True during async operations */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Last error message */
  readonly error = computed(() => this._state().error);

  // =========================================================================
  // DERIVED SELECTORS (convenience)
  // =========================================================================

  /** Current username or null */
  readonly username = computed(() => this._state().user?.username ?? null);

  /** User display name (firstname or username) */
  readonly displayName = computed(() => {
    const user = this._state().user;
    return user?.firstname || user?.username || null;
  });

  /** User roles array */
  readonly roles = computed(() => this._state().user?.userRoles ?? []);

  /** True if user must change password */
  readonly mustChangePassword = computed(() => this._state().user?.mustChangePassword ?? false);

  /** True if 2FA is enabled */
  readonly twoFactorEnabled = computed(() => this._state().user?.twoFactorEnabled ?? false);

  // =========================================================================
  // ROLE CHECKERS
  // =========================================================================

  /** Check if user has specific role */
  hasRole(role: UserRole): boolean {
    return this.roles().includes(role);
  }

  /** Check if user has any of the specified roles */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /** True if user is admin */
  readonly isAdmin = computed(() =>
    this.roles().includes(UserRole.ADMIN) || this.roles().includes(UserRole.SUPER_ADMIN)
  );

  // =========================================================================
  // MUTATIONS
  // =========================================================================

  /** Set user session after successful login/refresh */
  setUser(user: UserSession): void {
    this._state.update(state => ({
      ...state,
      user,
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
      error: null
    }));
  }

  /** Set loading state */
  setLoading(isLoading: boolean): void {
    this._state.update(state => ({ ...state, isLoading }));
  }

  /** Set error state */
  setError(error: string): void {
    this._state.update(state => ({
      ...state,
      error,
      isLoading: false
    }));
  }

  /** Mark as initialized (after initial auth check) */
  setInitialized(): void {
    this._state.update(state => ({
      ...state,
      isInitialized: true,
      isLoading: false
    }));
  }

  /** Clear error */
  clearError(): void {
    this._state.update(state => ({ ...state, error: null }));
  }

  /** Reset to initial state (logout) */
  reset(): void {
    this._state.set(initialAuthState);
  }
}
