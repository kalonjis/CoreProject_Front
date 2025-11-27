import { HttpContextToken } from '@angular/common/http';

/**
 * HTTP Context tokens for controlling interceptor behavior.
 *
 * Modern Angular approach (v15+) using HttpContext instead of custom headers.
 * This allows type-safe, clean control of interceptor behavior per-request.
 *
 * Usage:
 * ```typescript
 * // In a service
 * this.http.post('/api/auth/refresh-token', {}, {
 *   context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true)
 * });
 *
 * // Or via HttpUtilService
 * this.httpUtil.post('/api/auth/refresh-token', {}, true); // skipInterceptor = true
 * ```
 */

/**
 * Skip the auth interceptor entirely.
 * Use for: refresh token requests, public endpoints that shouldn't trigger 401 handling.
 */
export const SKIP_AUTH_INTERCEPTOR = new HttpContextToken<boolean>(() => false);
