import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const httpErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<any> => {
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        // Network error or server not responding
        console.error('Network error or server not responding', error);
        // Could show a toast notification here
      } else if (error.status === 401) {
        // Unauthorized - redirect to login
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Forbidden - could redirect to "access denied" page
        console.error('Forbidden access', error);
      } else if (error.status === 404) {
        // Not found
        console.error('Resource not found', error);
      } else if (error.status === 422 || error.status === 400) {
        // Validation errors - handle in the components
        // No global handling needed
      } else {
        // Other server errors
        console.error('Server error', error);
        // Could show a toast notification here
      }

      return throwError(() => error);
    })
  );
};
