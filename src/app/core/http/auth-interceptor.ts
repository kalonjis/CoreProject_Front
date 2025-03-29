// src/app/core/http/auth-interceptor.ts
import { HttpInterceptorFn, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Observable, BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

// Un sujet pour suivre si un refresh est en cours
let isRefreshing = false;

// File d'attente pour stocker les requêtes en attente de refresh
const pendingRequests: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Ajouter withCredentials à toutes les requêtes pour envoyer les cookies
  const authReq = req.clone({
    withCredentials: true
  });

  // Ne pas intercepter les requêtes de refresh token pour éviter les boucles
  if (req.url.includes('/api/auth/refresh-token')) {
    return next(authReq);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si l'erreur est 401 ou 403 (token expiré ou invalide)
      if ((error.status === 401 || error.status === 403) && !req.url.includes('/api/auth/login')) {
        // Si un refresh token est déjà en cours
        if (isRefreshing) {
          // Attendre la fin du refresh et réessayer la requête
          return pendingRequests.pipe(
            switchMap(success => {
              if (success) {
                // Réessayer la requête originale
                return next(authReq);
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

            // Réessayer la requête originale
            return next(authReq);
          }),
          catchError(refreshError => {
            // Le refresh a échoué
            isRefreshing = false;
            pendingRequests.next(false);

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
