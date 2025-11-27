import { UserSession } from './user-session.model';

/**
 * Authentication state managed by AuthStore.
 * Represents the current authentication context of the application.
 *
 * Note: Device state is managed separately by DeviceStore (SoC).
 */
export interface AuthState {
  /** Current authenticated user session, null if not authenticated */
  user: UserSession | null;

  /** True if user is authenticated (has valid session) */
  isAuthenticated: boolean;

  /** True after initial auth check completes (app bootstrap) */
  isInitialized: boolean;

  /** True during async operations (login, logout, refresh) */
  isLoading: boolean;

  /** Last error message, null if no error */
  error: string | null;
}

/**
 * Initial state used when creating the AuthStore.
 */
export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null
};
