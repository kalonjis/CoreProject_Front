import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {catchError, Observable, throwError} from 'rxjs';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          // Network error or server not responding
          console.error('Network error or server not responding', error);
          // Could show a toast notification here
        } else if (error.status === 401) {
          // Unauthorized - redirect to login
          this.router.navigate(['/login']);
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
  }
}
