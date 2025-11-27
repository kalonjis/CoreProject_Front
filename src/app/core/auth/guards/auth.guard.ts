import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

import { AuthFacade } from '../services/auth.facade';

/**
 * Auth guard using the new AuthFacade.
 *
 * Waits for initialization before checking auth status.
 * Redirects to login if not authenticated.
 *
 * @param isPasswordChangePage - Set to true for password change route
 *                               to allow access even with mustChangePassword
 */
export const authGuard = (isPasswordChangePage = false): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const authFacade = inject(AuthFacade);

    // Wait for auth to be initialized
    return toObservable(authFacade.isInitialized).pipe(
      filter(initialized => initialized),
      take(1),
      map(() => {
        // Not authenticated → redirect to login
        if (!authFacade.isAuthenticated()) {
          router.navigate(['/auth/login'], {
            queryParams: { returnUrl: router.url }
          });
          return false;
        }

        // Must change password → redirect (except on password page)
        if (authFacade.mustChangePassword() && !isPasswordChangePage) {
          router.navigate(['/auth/change-password'], {
            queryParams: { forced: 'true' }
          });
          return false;
        }

        return true;
      })
    );
  };
};

/**
 * Guest guard - only allows unauthenticated users.
 * Redirects to dashboard if already authenticated.
 */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authFacade = inject(AuthFacade);

  return toObservable(authFacade.isInitialized).pipe(
    filter(initialized => initialized),
    take(1),
    map(() => {
      if (authFacade.isAuthenticated()) {
        router.navigate(['/']);
        return false;
      }
      return true;
    })
  );
};

/**
 * Role guard - checks if user has required role(s).
 *
 * @param allowedRoles - Array of roles that can access the route
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const authFacade = inject(AuthFacade);

    return toObservable(authFacade.isInitialized).pipe(
      filter(initialized => initialized),
      take(1),
      map(() => {
        if (!authFacade.isAuthenticated()) {
          router.navigate(['/auth/login']);
          return false;
        }

        const userRoles = authFacade.roles();
        const hasRole = allowedRoles.some(role => userRoles.includes(role as any));

        if (!hasRole) {
          router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  };
};
