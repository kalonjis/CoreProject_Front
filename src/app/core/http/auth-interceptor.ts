import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, switchMap, catchError, Subject } from 'rxjs';
import { Router } from '@angular/router';

import { SKIP_AUTH_INTERCEPTOR } from './http.context';
import { AuthStore } from '../auth/state/auth.store';
import { AuthApiService } from '../auth/services/auth-api.service';
import { isPublicApiRoute, isPublicFrontendRoute } from '../auth/config/public-routes.config';

// Refresh token state
let isRefreshing = false;
const refreshComplete$ = new Subject<boolean>();

/**
 * Get CSRF token from cookies
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
 * Auth interceptor using HttpContext (Angular modern approach)
 */
export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
  ): Observable<HttpEvent<unknown>> => {

    const router = inject(Router);
    const authStore = inject(AuthStore);
    const authApi = inject(AuthApiService);

    // =========================================================================
    // 1. Check if we should skip this interceptor
    // =========================================================================
    if (req.context.get(SKIP_AUTH_INTERCEPTOR)) {
      return next(req);
    }

    // =========================================================================
    // 2. Check if this is a public route
    // =========================================================================
    const currentUrl = router.url;
    const isPublicRoute = isPublicFrontendRoute(currentUrl);
    const isAuthStatusCheck = req.url.includes('/api/auth/session') ||
      req.url.includes('/api/auth/status');

    // =========================================================================
    // 3. Clone request with credentials and CSRF token
    // =========================================================================
    let authReq = req.clone({ withCredentials: true });

    const csrfToken = getCsrfToken();
    if (csrfToken && req.method !== 'GET') {
      authReq = authReq.clone({
        headers: authReq.headers.set('X-XSRF-TOKEN', csrfToken)
      });
    }

    // =========================================================================
    // 4. Skip refresh logic for public routes
    // =========================================================================
    if (isPublicRoute && !isAuthStatusCheck) {
      return next(authReq);
    }

    // =========================================================================
    // 5. Handle request with 401 retry logic
    // =========================================================================
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isPublicApiRoute(req.url)) {
          return handleUnauthorized(authReq, next, authApi, authStore, router);
        }
        return throwError(() => error);
      })
    );
  };

  /**
   * Handle 401 errors by attempting token refresh
   */
  function handleUnauthorized(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    authApi: AuthApiService,
    authStore: AuthStore,
    router: Router
  ): Observable<HttpEvent<unknown>> {

    if (isRefreshing) {
      // Wait for ongoing refresh to complete, then retry
      return refreshComplete$.pipe(
        switchMap(success => {
          if (success) {
            return next(req);
          }
          return throwError(() => new HttpErrorResponse({ status: 401 }));
        })
      );
    }

    isRefreshing = true;

  return authApi.refreshToken().pipe(
    switchMap(() => {
      isRefreshing = false;
      refreshComplete$.next(true);
      return next(req);
    }),
    catchError(refreshError => {
      isRefreshing = false;
      refreshComplete$.next(false);

      // Clear auth state and redirect to login
      authStore.reset();
      router.navigate(['/auth/login'], {
        queryParams: { expired: 'true' }
      });

      return throwError(() => refreshError);
    })
  );
}
