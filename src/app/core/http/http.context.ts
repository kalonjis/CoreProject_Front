import { HttpContextToken } from '@angular/common/http';

/**
 * HTTP Context tokens for controlling interceptor behavior.
 *
 * Usage:
 * ```typescript
 * this.http.post('/api/auth/refresh-token', {}, {
 *   context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true)
 * });
 * ```
 */

/** Skip the auth interceptor (refresh logic, error handling) */
export const SKIP_AUTH_INTERCEPTOR = new HttpContextToken<boolean>(() => false);
