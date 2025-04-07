// src/app/core/auth/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function authGuard() {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Stocker l'URL que l'utilisateur essayait d'atteindre
  const returnUrl = router.url;

  // Rediriger vers la page de connexion avec l'URL de retour
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl }
  });

  return false;
}
