// src/app/core/auth/guards/super-admin.guard.ts

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '../services/auth.facade';
import { UserRole } from '../../../data/models/user/user-role';

/**
 * Super Admin guard for highly restricted routes.
 *
 * Protects routes that require SUPER_ADMIN role specifically.
 * Unlike adminGuard which allows ADMIN or SUPER_ADMIN, this guard
 * requires the highest privilege level.
 *
 * Use cases:
 * - System health monitoring
 * - Circuit breaker management
 * - Critical system configuration
 *
 * Flow:
 * 1. Check authentication
 * 2. Check SUPER_ADMIN role specifically
 * 3. Check password change requirement
 *
 * Usage in routes:
 * ```typescript
 * {
 *   path: 'system-health',
 *   canActivate: [() => superAdminGuard()],
 *   loadComponent: () => import('./system-health.component')
 * }
 * ```
 */
export function superAdminGuard(): boolean {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  // Not authenticated → redirect to login
  if (!authFacade.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: router.url }
    });
    return false;
  }

  // Check SUPER_ADMIN role specifically
  if (!authFacade.hasRole(UserRole.SUPER_ADMIN)) {
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
