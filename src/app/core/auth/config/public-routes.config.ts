// src/app/core/auth/config/public-routes.config.ts

/**
 * Public routes configuration.
 * Routes that don't require authentication.
 */

/**
 * Public API routes that should NOT trigger login redirect on 401/403.
 */
export const PUBLIC_API_ROUTES = [
  // Auth
  '/api/auth/login',
  '/api/auth/initiate-login',
  '/api/auth/refresh-token',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/status',
  '/api/auth/signup',
  // 2FA (during login flow - user not yet authenticated)
  '/api/auth/2fa-status',
  '/api/auth/2fa/choose-method',
  '/api/auth/2fa/available-methods',
  '/api/auth/verify-2fa',
  '/api/auth/resend-2fa-code',
  // Account & Device
  '/api/account-confirmation/',
  '/api/user/device/confirm',
  '/api/user/device/reject',
  // Password
  '/api/password/',
];

/**
 * Public frontend routes that don't require authentication
 * and should NOT trigger token refresh.
 */
export const PUBLIC_FRONTEND_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/two-factor',
  '/auth/account-confirmation',
  '/auth/device-confirmation',
  '/password/forgot',
  '/password/reset',
  '/password/reset-code',
  '/password/verify-code',
];

/**
 * Check if URL is a public API route.
 */
export function isPublicApiRoute(url: string): boolean {
  return PUBLIC_API_ROUTES.some(route => url.includes(route));
}

/**
 * Check if URL is a public frontend route.
 * Handles exact match, path prefix, and query params.
 */
export function isPublicFrontendRoute(url: string): boolean {
  // Remove query params for comparison
  const urlPath = url.split('?')[0];

  return PUBLIC_FRONTEND_ROUTES.some(route =>
    urlPath === route || urlPath.startsWith(`${route}/`)
  );
}
