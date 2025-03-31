// src/app/core/http/auth-interceptor.ts
import { HttpInterceptorFn, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Observable, BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { isPublicApiRoute, isPublicFrontendRoute } from '../auth/config/public-routes.config';

// Un sujet pour suivre si un refresh est en cours
let isRefreshing = false;

// File d'attente pour stocker les requêtes en attente de refresh
const pendingRequests: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

/**
 * Récupère le token CSRF à partir des cookies
 */
function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Intercepteur HTTP qui gère l'ajout de cookies, la gestion des erreurs d'authentification
 * et le rafraîchissement automatique du token.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1. Ne pas intercepter les requêtes marquées pour être ignorées
  if (req.headers.has('X-Skip-Interceptor')) {
    // Créer une nouvelle requête sans cet en-tête pour ne pas l'envoyer au serveur
    const cleanedReq = req.clone({
      headers: req.headers.delete('X-Skip-Interceptor')
    });
    return next(cleanedReq);
  }

  // 2. Récupérer l'URL actuelle et vérifier si c'est une route publique
  const currentUrl = router.url;
  const isPublicRoute = isPublicFrontendRoute(currentUrl);
  const isAuthStatusCheck = req.url.includes('/api/auth/me') || req.url.includes('/api/auth/status');

  // 3. Récupérer le token CSRF
  const csrfToken = getCsrfToken();

  // 4. Ajouter withCredentials et éventuellement l'en-tête CSRF
  let authReq = req.clone({
    withCredentials: true
  });

  // 5. Ajouter le token CSRF pour les requêtes non GET
  if (csrfToken && req.method !== 'GET') {
    authReq = authReq.clone({
      headers: authReq.headers.set('X-XSRF-TOKEN', csrfToken)
    });
  }

  // 6. Ne pas appliquer la logique de refresh token pour les routes publiques
  if (isPublicRoute && !isAuthStatusCheck) {
    return next(authReq);
  }

  // 7. Ne pas intercepter les requêtes de refresh token pour éviter les boucles
  if (req.url.includes('/api/auth/refresh-token')) {
    return next(authReq);
  }

  // 8. Traitement de la requête avec gestion d'erreur
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Vérifier si c'est une erreur d'authentification et si la route n'est pas publique
      if ((error.status === 401 || error.status === 403) && !isPublicApiRoute(req.url)) {
        // Si on est sur une route publique frontend, ne pas tenter de refresh
        if (isPublicRoute && !isAuthStatusCheck) {
          return throwError(() => error);
        }

        console.log(`Erreur d'authentification sur ${req.url}, tentative de refresh token`);

        // Si un refresh token est déjà en cours
        if (isRefreshing) {
          // Attendre la fin du refresh et réessayer la requête
          return pendingRequests.pipe(
            switchMap(success => {
              if (success) {
                // Réessayer la requête originale avec potentiellement un nouveau token CSRF
                const newCsrfToken = getCsrfToken();
                let newReq = req.clone({ withCredentials: true });

                if (newCsrfToken && req.method !== 'GET') {
                  newReq = newReq.clone({
                    headers: newReq.headers.set('X-XSRF-TOKEN', newCsrfToken)
                  });
                }

                return next(newReq);
              }
              // Si le refresh a échoué, rediriger vers login
              return throwError(() => error);
            })
          );
        }

        // Marquer le début d'un refresh
        isRefreshing = true;
        // Réinitialiser le sujet pour les requêtes en attente
        pendingRequests.next(false);

        // Appeler le service pour rafraîchir le token
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Le refresh a réussi
            isRefreshing = false;
            pendingRequests.next(true);

            // Réessayer la requête originale avec le nouveau token CSRF
            const newCsrfToken = getCsrfToken();
            let newReq = req.clone({ withCredentials: true });

            if (newCsrfToken && req.method !== 'GET') {
              newReq = newReq.clone({
                headers: newReq.headers.set('X-XSRF-TOKEN', newCsrfToken)
              });
            }

            return next(newReq);
          }),
          catchError(refreshError => {
            // Le refresh a échoué
            isRefreshing = false;
            pendingRequests.next(false);

            // Ne pas rediriger si on est sur une route publique
            if (isPublicRoute) {
              return throwError(() => refreshError);
            }

            // Déconnecter l'utilisateur et rediriger
            authService.clearSession();
            router.navigate(['/auth/login'], {
              queryParams: { expired: 'true' }
            });

            return throwError(() => refreshError);
          })
        );
      }

      // Pour les autres erreurs, les propager normalement
      return throwError(() => error);
    })
  );
};
