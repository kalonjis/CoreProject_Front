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

  // Vérifier l'authenticité de la session pour le débogage
  console.log(`[AuthInterceptor] Requête vers ${req.url}, authentifié: ${sessionService.isAuthenticated()}`);

  // Pour les requêtes vers /api/auth/me, on ne veut pas de comportement spécial
  if (req.url.includes('/api/auth/me')) {
    console.log("[AuthInterceptor] Requête vers /api/auth/me, passage direct");
    return next(req);
  }

  // Passer directement les requêtes d'authentification
  if (isAuthEndpoint) {
    console.log("[AuthInterceptor] Requête d'authentification, passage direct");
    return next(req);
  }

  // Si l'utilisateur est authentifié, vérifier et rafraîchir le token si nécessaire
  if (sessionService.isAuthenticated()) {
    console.log("[AuthInterceptor] Utilisateur authentifié, vérification du token");
    return from(sessionService.refreshTokenIfNeeded()).pipe(
      switchMap(() => next(req))
    );
  }

  // Sinon, continuer normalement
  console.log("[AuthInterceptor] Utilisateur non authentifié, passage de la requête sans modification");
  return next(req);
};
