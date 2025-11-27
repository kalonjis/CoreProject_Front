import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SKIP_AUTH_INTERCEPTOR } from './http.context';

/**
 * HTTP options interface for internal use.
 */
interface HttpOptions {
  context?: HttpContext;
  withCredentials: boolean;
}

/**
 * HttpUtilService - Utility wrapper for HttpClient.
 *
 * Provides a clean API for HTTP requests with built-in support for:
 * - httpOnly cookies (withCredentials: true by default)
 * - Skipping auth interceptor via HttpContext (modern Angular approach)
 *
 * Why use this?
 * - Consistent configuration across all HTTP calls
 * - No need to manually set withCredentials every time
 * - Type-safe interceptor bypass (no magic headers)
 *
 * Usage:
 * ```typescript
 * // Normal request (goes through interceptor)
 * this.httpUtil.get<User>('/api/users/me');
 *
 * // Skip interceptor (e.g., for refresh token)
 * this.httpUtil.post('/api/auth/refresh-token', {}, true);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class HttpUtilService {

  private readonly http = inject(HttpClient);

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /**
   * HTTP GET request.
   * @param url - Endpoint URL
   * @param skipInterceptor - If true, bypasses auth interceptor
   */
  get<T>(url: string, skipInterceptor = false): Observable<T> {
    return this.http.get<T>(url, this.createOptions(skipInterceptor));
  }

  /**
   * HTTP POST request.
   * @param url - Endpoint URL
   * @param body - Request body
   * @param skipInterceptor - If true, bypasses auth interceptor
   */
  post<T>(url: string, body: unknown, skipInterceptor = false): Observable<T> {
    return this.http.post<T>(url, body, this.createOptions(skipInterceptor));
  }

  /**
   * HTTP PUT request.
   * @param url - Endpoint URL
   * @param body - Request body
   * @param skipInterceptor - If true, bypasses auth interceptor
   */
  put<T>(url: string, body: unknown, skipInterceptor = false): Observable<T> {
    return this.http.put<T>(url, body, this.createOptions(skipInterceptor));
  }

  /**
   * HTTP PATCH request.
   * @param url - Endpoint URL
   * @param body - Request body
   * @param skipInterceptor - If true, bypasses auth interceptor
   */
  patch<T>(url: string, body: unknown, skipInterceptor = false): Observable<T> {
    return this.http.patch<T>(url, body, this.createOptions(skipInterceptor));
  }

  /**
   * HTTP DELETE request.
   * @param url - Endpoint URL
   * @param skipInterceptor - If true, bypasses auth interceptor
   */
  delete<T>(url: string, skipInterceptor = false): Observable<T> {
    return this.http.delete<T>(url, this.createOptions(skipInterceptor));
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  /**
   * Creates HTTP options with credentials and optional interceptor bypass.
   */
  private createOptions(skipInterceptor: boolean): HttpOptions {
    const options: HttpOptions = {
      withCredentials: true
    };

    if (skipInterceptor) {
      options.context = new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true);
    }

    return options;
  }
}
