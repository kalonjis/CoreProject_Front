import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError, Subject, take } from 'rxjs';
import { Router } from '@angular/router';

import { SKIP_AUTH_INTERCEPTOR } from './http.context';
import { AuthStore } from '../auth/state/auth.store';
import { DeviceStore } from '../device/state/device.store';
import { AuthApiService } from '../auth/services/auth-api.service';
import { AuthSyncService } from '../auth/services/auth-sync.service';
import { isPublicApiRoute, isPublicFrontendRoute } from '../auth/config/public-routes.config';

// =========================================================================
// REFRESH TOKEN STATE (module-level singleton)
// =========================================================================

let isRefreshing = false;
const refreshComplete$ = new Subject<boolean>();

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Get CSRF token from cookies.
 * Required for non-GET requests when CSRF protection is enabled on backend.
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
 * Clear all auth state and stop sync.
 * Called when refresh token fails (session expired).
 */
function clearSession(
  authStore: AuthStore,
  deviceStore: DeviceStore,
  syncService: AuthSyncService
): void {
  authStore.reset();
  deviceStore.reset();
  syncService.stopListening();
}

// =========================================================================
// MAIN INTERCEPTOR
// =========================================================================

/**
 * Auth interceptor using HttpContext (Angular 15+ modern approach).
 *
 * Responsibilities:
 * - Add withCredentials to all requests (for httpOnly cookies)
 * - Add CSRF token to non-GET requests
 * - Handle 401 errors with automatic token refresh
 * - Handle 403 PASSWORD_CHANGE_REQUIRED redirect
 * - Queue concurrent requests during refresh
 *
 * Skip behavior:
 * - Requests with SKIP_AUTH_INTERCEPTOR context token bypass all logic
 * - Public routes don't trigger refresh on 401
 */
export const authInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  // Inject dependencies
  const router = inject(Router);
  const authStore = inject(AuthStore);
  const deviceStore = inject(DeviceStore);
  const authApi = inject(AuthApiService);
  const syncService = inject(AuthSyncService);

  // =========================================================================
  // 1. Check if we should skip this interceptor
  // =========================================================================
  if (req.context.get(SKIP_AUTH_INTERCEPTOR)) {
    return next(req);
  }

  // =========================================================================
  // 2. Determine route context
  // =========================================================================
  const currentUrl = router.url;
  const isPublicRoute = isPublicFrontendRoute(currentUrl);
  const isAuthStatusCheck =
    req.url.includes('/api/auth/session') ||
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
  // 4. Skip refresh logic for public routes (except auth checks)
  // =========================================================================
  if (isPublicRoute && !isAuthStatusCheck) {
    return next(authReq);
  }

  // =========================================================================
  // 5. Handle request with error handling
  // =========================================================================
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // -----------------------------------------------------------------
      // 5a. Handle PASSWORD_CHANGE_REQUIRED (403)
      // -----------------------------------------------------------------
      if (error.status === 403 && error.error?.error === 'PASSWORD_CHANGE_REQUIRED') {
        console.log('[AuthInterceptor] Password change required, redirecting...');
        router.navigate(['/password/change'], {
          queryParams: { forced: 'true' }
        });
        return throwError(() => error);
      }

      // -----------------------------------------------------------------
      // 5b. Handle Unauthorized (401) - attempt token refresh
      // -----------------------------------------------------------------
      if (error.status === 401 && !isPublicApiRoute(req.url)) {
        return handleUnauthorized(
          authReq,
          next,
          authApi,
          authStore,
          deviceStore,
          syncService,
          router
        );
      }

      // -----------------------------------------------------------------
      // 5c. All other errors - pass through
      // -----------------------------------------------------------------
      return throwError(() => error);
    })
  );
};

// =========================================================================
// 401 HANDLER WITH TOKEN REFRESH
// =========================================================================

/**
 * Handle 401 errors by attempting token refresh.
 *
 * If a refresh is already in progress, queues the request to retry
 * after the refresh completes (prevents multiple simultaneous refresh calls).
 */
function handleUnauthorized(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authApi: AuthApiService,
  authStore: AuthStore,
  deviceStore: DeviceStore,
  syncService: AuthSyncService,
  router: Router
): Observable<HttpEvent<unknown>> {

  // If already refreshing, wait for it to complete then retry
  if (isRefreshing) {
    return refreshComplete$.pipe(
      take(1), // Only take next emission (avoids memory leak)
      switchMap(success => {
        if (success) {
          return next(req);
        }
        return throwError(() => new HttpErrorResponse({ status: 401 }));
      })
    );
  }

  // Start refresh process
  isRefreshing = true;

  return authApi.refreshToken().pipe(
    switchMap(() => {
      // Refresh succeeded
      isRefreshing = false;
      refreshComplete$.next(true);
      return next(req);
    }),
    catchError(refreshError => {
      // Refresh failed - session expired
      isRefreshing = false;
      refreshComplete$.next(false);

      console.log('[AuthInterceptor] Refresh failed, clearing session...');

      // Clear all auth state
      clearSession(authStore, deviceStore, syncService);

      // Broadcast to other tabs
      syncService.broadcastSessionExpired();

      // Redirect to login with expired flag
      router.navigate(['/auth/login'], {
        queryParams: { expired: 'true' }
      });

      return throwError(() => refreshError);
    })
  );
}
