// auth.interceptor.ts
import { HttpInterceptorFn, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import {AuthService} from '../auth/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Pas besoin d'ajouter des headers, juste s'assurer que les cookies sont envoyés
  const authReq = req.clone({
    withCredentials: true
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Session expirée, rediriger vers login
        localStorage.removeItem('user');
        router.navigate(['/login'], {
          queryParams: {
            expired: 'true',
            returnUrl: router.url
          }
        });
      }
      return throwError(() => error);
    })
  );
};
