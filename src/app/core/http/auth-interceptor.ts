import { HttpInterceptorFn, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { SessionService } from '../auth/services/session.service';

/**
 * Intercepteur HTTP qui rafraîchit automatiquement le token JWT si nécessaire
 * avant chaque requête API
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<any> => {
  const sessionService = inject(SessionService);

  // Ne pas traiter les requêtes non-API ou les requêtes d'authentification
  const isAuthEndpoint = req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/refresh-token') ||
    req.url.includes('/api/auth/logout');

  // Passer directement les requêtes d'authentification
  if (isAuthEndpoint) {
    return next(req);
  }

  // Si l'utilisateur est authentifié, vérifier et rafraîchir le token si nécessaire
  if (sessionService.isAuthenticated) {
    return from(sessionService.refreshTokenIfNeeded()).pipe(
      switchMap(() => next(req))
    );
  }

  // Sinon, continuer normalement
  return next(req);
};
