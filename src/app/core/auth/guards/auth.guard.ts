// src/app/core/auth/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OldAuthService } from '../services/old.auth.service';

export function authGuard(requirePasswordChange: boolean = false) {
  const authService = inject(OldAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // If the user must change password and they're not already on the change password page
    if (authService.mustChangePassword() && !requirePasswordChange) {
      // Redirect to change password page
      router.navigate(['/auth/change-password'], {
        queryParams: { forced: 'true' }
      });
      return false;
    }

    // If we're on the change password page and password change is required, allow access
    if (requirePasswordChange && authService.mustChangePassword()) {
      return true;
    }

    // For normal pages, only allow access if password change is not required
    return !authService.mustChangePassword() || requirePasswordChange;
  }

  // User is not authenticated, redirect to login
  const returnUrl = router.url;
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl }
  });
  return false;
}
