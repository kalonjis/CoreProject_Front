import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OldAuthService } from '../services/old.auth.service';

/**
 * Guard qui vérifie si l'utilisateur a des privilèges d'administration
 * Vérifie d'abord l'authentification puis le rôle ADMIN
 */
export function adminGuard() {
  const authService = inject(OldAuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est connecté
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: router.url }
    });
    return false;
  }

  // Vérifier si l'utilisateur a le rôle ADMIN ou SUPER_ADMIN
  if (authService.hasRole('ADMIN') || authService.hasRole('SUPER_ADMIN')) {
    // Si l'utilisateur doit changer son mot de passe, rediriger
    if (authService.mustChangePassword()) {
      router.navigate(['/auth/change-password'], {
        queryParams: { forced: 'true', returnUrl: router.url }
      });
      return false;
    }
    return true;
  }

  // Si l'utilisateur n'a pas les droits requis
  router.navigate(['/access-denied']);
  return false;
}
