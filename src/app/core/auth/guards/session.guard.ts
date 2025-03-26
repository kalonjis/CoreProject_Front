import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { Observable, map, of, take } from 'rxjs';

/**
 * Guard avancé qui vérifie l'authentification et le niveau de confiance de l'appareil
 * @param requiredTrustLevel Niveau de confiance requis (optionnel)
 */
export function sessionGuard(requiredTrustLevel?: string): CanActivateFn {
  return (route, state) => {
    const router = inject(Router);
    const sessionService = inject(SessionService);

    // Si l'application n'est pas encore initialisée, attendre
    if (!sessionService.state().isInitialized) {
      // On patiente un peu pour laisser l'initialisation se faire
      return new Observable<boolean>(observer => {
        const checkInterval = setInterval(() => {
          if (sessionService.state().isInitialized) {
            clearInterval(checkInterval);

            // Une fois initialisé, on vérifie l'authentification
            if (!sessionService.isAuthenticated) {
              // Stocker l'URL cible pour y revenir après login
              localStorage.setItem('returnUrl', state.url);
              router.navigate(['/auth/login']);
              observer.next(false);
            } else if (requiredTrustLevel && !sessionService.hasRequiredTrustLevel(requiredTrustLevel)) {
              // Vérifier le niveau de confiance de l'appareil si nécessaire
              router.navigate(['/device-verification'], {
                queryParams: {
                  returnUrl: state.url,
                  requiredLevel: requiredTrustLevel
                }
              });
              observer.next(false);
            } else {
              observer.next(true);
            }

            observer.complete();
          }
        }, 100);

        // Nettoyage en cas d'annulation
        return () => clearInterval(checkInterval);
      });
    }

    // Si déjà initialisé, vérifier l'authentification directement
    if (!sessionService.isAuthenticated) {
      localStorage.setItem('returnUrl', state.url);
      router.navigate(['/auth/login']);
      return false;
    }

    // Vérifier le niveau de confiance si requis
    if (requiredTrustLevel && !sessionService.hasRequiredTrustLevel(requiredTrustLevel)) {
      router.navigate(['/device-verification'], {
        queryParams: {
          returnUrl: state.url,
          requiredLevel: requiredTrustLevel
        }
      });
      return false;
    }

    return true;
  };
}

/**
 * Guard vérifiant les permissions administrateur
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sessionService = inject(SessionService);

  // Vérifier d'abord l'authentification
  if (!sessionService.isAuthenticated) {
    localStorage.setItem('returnUrl', state.url);
    router.navigate(['/auth/login']);
    return false;
  }

  // Puis vérifier les droits admin
  if (!sessionService.isAdmin) {
    router.navigate(['/access-denied']);
    return false;
  }

  return true;
};
