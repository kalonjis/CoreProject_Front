import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, switchMap, catchError, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

// Services d'erreur
import { HttpErrorAnalyzerService } from '../errors/services/http-error-analyzer.service';
import { GlobalErrorManagerService } from '../errors/services/global-error-manager.service';

// Services existants
import { AuthService } from '../auth/services/auth.service';
import { isPublicApiRoute, isPublicFrontendRoute } from '../auth/config/public-routes.config';

// Gestion du refresh token avec signaux
const isRefreshingSignal = signal(false);
const pendingRequests = new Subject<boolean>();

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
 * Intercepteur HTTP avec signaux Angular
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const errorAnalyzer = inject(HttpErrorAnalyzerService);
  const errorManager = inject(GlobalErrorManagerService);

  // 1. Ne pas intercepter les requêtes marquées pour être ignorées
  if (req.headers.has('X-Skip-Interceptor')) {
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
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Analyser et gérer les erreurs même pour les routes publiques
        return handleHttpError(error, req.url, errorAnalyzer, errorManager);
      })
    );
  }

  // 7. Ne pas intercepter les requêtes de refresh token pour éviter les boucles
  if (req.url.includes('/api/auth/refresh-token')) {
    return next(authReq);
  }

  // 8. Traitement de la requête avec gestion d'erreur
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gestion spécifique des erreurs 403 (votre logique existante)
      if (error.status === 403) {
        // Vérifier si l'erreur vient d'une tentative de désactivation de son propre compte
        if (error.url?.includes('/api/admin/users/deactivate/') &&
          error.error?.error?.includes("own account")) {
          return throwError(() => error);
        }

        // Vérifier si l'erreur vient d'une tentative de désactivation d'un SUPER_ADMIN sans droits
        if (error.url?.includes('/api/admin/users/deactivate/') &&
          error.error?.error?.includes("SUPER_ADMIN privileges")) {
          return throwError(() => error);
        }
      }

      // Gestion des erreurs d'authentification 401/403
      if ((error.status === 401 || error.status === 403) && !isPublicApiRoute(req.url)) {
        // Si on est sur une route publique frontend, ne pas tenter de refresh
        if (isPublicRoute && !isAuthStatusCheck) {
          return throwError(() => error);
        }

        console.log(`Erreur d'authentification sur ${req.url}, tentative de refresh token`);

        // Si un refresh token est déjà en cours (utilisation du signal)
        if (isRefreshingSignal()) {
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
              return throwError(() => error);
            })
          );
        }

        // Marquer le début d'un refresh (avec signal)
        isRefreshingSignal.set(true);
        pendingRequests.next(false);

        // Appeler le service pour rafraîchir le token
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Le refresh a réussi
            isRefreshingSignal.set(false);
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
            isRefreshingSignal.set(false);
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

      // Gestion générique des autres erreurs HTTP
      return handleHttpError(error, req.url, errorAnalyzer, errorManager);
    })
  );
};

/**
 * Gestion générique des erreurs HTTP
 */
function handleHttpError(
  error: HttpErrorResponse,
  url: string,
  analyzer: HttpErrorAnalyzerService,
  manager: GlobalErrorManagerService
): Observable<never> {

  // Analyser l'erreur avec le service générique
  const context = analyzer.analyze(error, url);

  // Les erreurs avec action 'feedback' ou 'inline' sont laissées aux composants
  if (context.action === 'feedback' || context.action === 'inline') {
    // Ne pas traiter ici, laisser le composant gérer
    return throwError(() => error);
  }

  // Traiter les autres types d'erreurs (redirect, modal, banner, page)
  manager.handleError(context);

  // Toujours propager l'erreur pour que les composants puissent réagir si nécessaire
  return throwError(() => error);
}

/**
 * Fonction utilitaire pour accéder à l'état du refresh depuis l'extérieur (optionnel)
 */
export function isRefreshTokenInProgress(): boolean {
  return isRefreshingSignal();
}
