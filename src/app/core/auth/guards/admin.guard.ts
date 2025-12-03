import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthFacade } from '../services/auth.facade';

/**
 * Admin guard using AuthFacade (new architecture).
 *
 * Protects routes that require ADMIN or SUPER_ADMIN role.
 * First checks authentication, then role, then password change requirement.
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [() => adminGuard()],
 *   loadChildren: () => import('./admin/admin.routes')
 * }
 * ```
 */
export function adminGuard(): boolean {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  // Not authenticated → redirect to login
  if (!authFacade.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: router.url }
    });
    return false;
  }

  // Check admin role
  if (!authFacade.isAdmin()) {
    router.navigate(['/access-denied']);
    return false;
  }

  // Must change password → redirect
  if (authFacade.mustChangePassword()) {
    router.navigate(['/password/change'], {
      queryParams: { forced: 'true', returnUrl: router.url }
    });
    return false;
  }

  return true;
}
