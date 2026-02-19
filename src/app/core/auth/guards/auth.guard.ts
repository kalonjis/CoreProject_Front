import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthFacade } from '../services/auth.facade';

/**
 * Auth guard using AuthFacade (new architecture).
 *
 * Protects routes that require authentication.
 * Also handles forced password change redirect.
 *
 * @param isPasswordChangePage - Set to true for the change-password route
 *                               to allow access even when mustChangePassword is true
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'profile',
 *   canActivate: [() => authGuard()],
 *   loadComponent: () => import('./profile.component')
 * },
 * {
 *   path: 'change-password',
 *   canActivate: [() => authGuard(true)], // Allow access for password change
 *   loadComponent: () => import('./change-password.component')
 * }
 * ```
 */
// auth.guard.ts
export function authGuard(isPasswordChangePage: boolean = false): boolean {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  // Page de changement forcé : le JWT est valide (login vient de réussir),
  // le backend protège la route via MustChangePasswordFilter.
  // Pas besoin que le store soit peuplé ici.
  if (isPasswordChangePage) {
    return true;
  }

  if (!authFacade.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: router.url }
    });
    return false;
  }

  if (authFacade.mustChangePassword()) {
    router.navigate(['/password/change'], {
      queryParams: { forced: 'true', returnUrl: router.url }
    });
    return false;
  }

  return true;
}
