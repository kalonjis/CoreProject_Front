// src/app/core/http/http-error-interceptor.ts
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {SessionService} from '../auth/services/session.service';

export const httpErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<any> => {
  const router = inject(Router);
  const sessionService = inject(SessionService);


  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        // Network error or server not responding
        console.error('Network error or server not responding', error);
      } else if (error.status === 401) {
        // Unauthorized - update auth state and redirect to login
        sessionService.logout().subscribe();
      } else if (error.status === 403) {
        // Forbidden
        console.error('Forbidden access', error);
      } else {
        console.error('Error', error);
      }

      return throwError(() => error);
    })
  );
};
