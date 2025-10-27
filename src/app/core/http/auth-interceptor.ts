import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, switchMap, catchError, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

// Services d'erreur
import { HttpErrorAnalyzerService } from '../errors/services/http-error-analyzer.service';
import { GlobalErrorManagerService } from '../errors/services/global-error-manager.service';

// Services existants
import { OldAuthService } from '../auth/services/old.auth.service';

// ✅ IMPORT UNIQUE depuis api-routes.constants.ts
import { isPublicApiRoute, isPublicFrontendRoute } from '../config/api-routes.constants';

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
 * ✅ Utilise directement les fonctions de api-routes.constants.ts
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authService = inject(OldAuthService);
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
      // ✅ Utilise isPublicApiRoute depuis api-routes.constants.ts
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
                // Réessayer la requête originale avec potentiellement un nouveau token
                return next(authReq);
              }
              return throwError(() => error);
            })
          );
        }

        // Démarrer le processus de refresh
        isRefreshingSignal.set(true);

        return authService.refreshToken().pipe(
          switchMap(() => {
            // Refresh réussi
            isRefreshingSignal.set(false);
            pendingRequests.next(true);

            // Réessayer la requête originale
            return next(authReq);
          }),
          catchError(refreshError => {
            // Refresh échoué
            isRefreshingSignal.set(false);
            pendingRequests.next(false);

            // Rediriger vers login seulement si pas déjà sur une route publique
            if (!isPublicRoute) {
              router.navigate(['/auth/login']);
            }

            return throwError(() => refreshError);
          })
        );
      }

      // Autres erreurs
      return handleHttpError(error, req.url, errorAnalyzer, errorManager);
    })
  );
};

/**
 * Gestion centralisée des erreurs HTTP
 */
function handleHttpError(
  error: HttpErrorResponse,
  url: string,
  errorAnalyzer: HttpErrorAnalyzerService,
  errorManager: GlobalErrorManagerService
): Observable<never> {
  // Analyser l'erreur
  const analysis = errorAnalyzer.analyze(error);

  // Gérer l'erreur globalement
  errorManager.handleError(analysis);

  // Propager l'erreur
  return throwError(() => error);
}
