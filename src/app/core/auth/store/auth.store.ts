import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../../../data/models/user/user';
import { LoginForm } from '../../../data/models/auth/login-form';
import { UserSignupForm } from '../../../data/models/user/user-signup-form';
import { RequestPasswordForm } from '../../../data/models/auth/request-password-form';
import { PasswordResetForm } from '../../../data/models/auth/password-reset-form';
import { ChangePasswordForm } from '../../../data/models/auth/change-password-form';
import { ChangeEmailForm } from '../../../data/models/auth/change-email-form';
import { tap, switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {UserRole} from '../../../data/models/user/user-role';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialState: AuthState = {
  user: null,
  isAuthenticated: hasValidToken(),
  isLoading: false,
  error: null
};

// Helper function to check if a valid token exists
function hasValidToken(): boolean {
  return document.cookie.includes('access_token');
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // Computed values
  withComputed((state) => ({
    username: computed(() => state.user()?.username),
    isAdmin: computed(() => state.user()?.userRoles.includes(UserRole.ADMIN) ||
      state.user()?.userRoles.includes(UserRole.SUPER_ADMIN)),
  })),

  // Methods
  withMethods((store, httpClient = inject(HttpClient), router = inject(Router)) => ({
    // Initialize the store
    init() {
      if (store.isAuthenticated()) {
        this.loadCurrentUser();
      }
    },

    // Load the current user
    loadCurrentUser() {
      patchState(store, { isLoading: true });

      httpClient.get<User>('/api/auth/me').pipe(
        tap({
          next: (user) => patchState(store, { user, isLoading: false }),
          error: () => patchState(store, { isAuthenticated: false, isLoading: false })
        })
      ).subscribe();
    },

    // Login method
    login(credentials: LoginForm) {
      patchState(store, { isLoading: true, error: null });

      return httpClient.post<any>('/api/auth/login', credentials).pipe(
        tap(() => patchState(store, { isAuthenticated: true })),
        switchMap(() => httpClient.get<User>('/api/auth/me')),
        tap({
          next: (user) => {
            patchState(store, { user, isLoading: false });
            router.navigate(['/']); // Navigate to home page after login
          },
          error: (error) => {
            patchState(store, {
              isAuthenticated: false,
              isLoading: false,
              error: error.error?.error || 'An error occurred during login.'
            });
          }
        })
      );
    },

    // Signup method
    signup(userData: UserSignupForm) {
      patchState(store, { isLoading: true, error: null });

      return httpClient.post<any>('/api/auth/signup', userData).pipe(
        tap({
          next: () => {
            patchState(store, { isLoading: false });
            router.navigate(['/auth/login'], { queryParams: { registered: 'true' } });
          },
          error: (error) => {
            patchState(store, {
              isLoading: false,
              error: error.error?.error || 'An error occurred during signup.'
            });
          }
        })
      );
    },

    // Logout method
    logout() {
      patchState(store, { isLoading: true });

      return httpClient.post<void>('/api/auth/logout', {}).pipe(
        tap({
          next: () => {
            patchState(store, {
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            router.navigate(['/auth/login']);
          },
          error: () => {
            // Even if the server request fails, we still want to log out the user
            patchState(store, {
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            router.navigate(['/auth/login']);
          }
        })
      );
    },

    // Request password reset
    requestPasswordReset(form: RequestPasswordForm) {
      patchState(store, { isLoading: true, error: null });

      return httpClient.post<any>('/api/password/request-password-reset', form).pipe(
        tap({
          next: () => patchState(store, { isLoading: false }),
          error: (error) => patchState(store, {
            isLoading: false,
            error: error.error?.error || 'An error occurred.'
          })
        })
      );
    },

    // Reset password with token
    resetPassword(token: string, form: PasswordResetForm) {
      patchState(store, { isLoading: true, error: null });

      return httpClient.put<any>(`/api/password/reset-password?token=${token}`, form).pipe(
        tap({
          next: () => {
            patchState(store, { isLoading: false });
            router.navigate(['/auth/login'], { queryParams: { reset: 'true' } });
          },
          error: (error) => patchState(store, {
            isLoading: false,
            error: error.error?.error || 'An error occurred.'
          })
        })
      );
    },

    // Change password for authenticated user
    changePassword(form: ChangePasswordForm) {
      patchState(store, { isLoading: true, error: null });

      return httpClient.put<any>('/api/password/change-password', form).pipe(
        tap({
          next: () => patchState(store, { isLoading: false }),
          error: (error) => patchState(store, {
            isLoading: false,
            error: error.error?.error || 'An error occurred.'
          })
        })
      );
    },

    // Request email change
    requestEmailChange(form: ChangeEmailForm) {
      patchState(store, { isLoading: true, error: null });

      return httpClient.post<any>('/api/auth/change-email-request', form).pipe(
        tap({
          next: () => patchState(store, { isLoading: false }),
          error: (error) => patchState(store, {
            isLoading: false,
            error: error.error?.error || 'An error occurred.'
          })
        })
      );
    },

    // Additional methods for email change can be added here...

    // Method to clear errors
    clearErrors() {
      patchState(store, { error: null });
    }
  }))
);
