// src/app/core/auth/guards/admin.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../store/auth.store';

export const adminGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated() && authStore.isAdmin()) {
    return true;
  }

  // If not authenticated, redirect to login
  if (!authStore.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  } else {
    // If authenticated but not admin, redirect to access denied
    router.navigate(['/access-denied']);
  }

  return false;
};
