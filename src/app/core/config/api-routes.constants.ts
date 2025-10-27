/**
 * Centralized API route constants for the Angular application.
 * This file mirrors the backend SecurityConstants.java structure.
 *
 * ⚠️ IMPORTANT: Keep these routes synchronized with backend SecurityConstants.java
 *
 * Usage example:
 * - this.http.get(AUTH_ROUTES.ME)
 * - this.http.post(AUTH_ROUTES.LOGIN, body)
 * - this.http.get(DEVICE_ROUTES.BY_ID(123))
 */

const API_BASE = '/api';

// ========== AUTH DOMAIN ==========
const AUTH_BASE = `${API_BASE}/auth`;

export const AUTH_ROUTES = {
  BASE: AUTH_BASE,
  LOGIN: `${AUTH_BASE}/login`,
  LOGOUT: `${AUTH_BASE}/logout`,
  REFRESH_TOKEN: `${AUTH_BASE}/refresh-token`,
  ME: `${AUTH_BASE}/me`,
  STATUS: `${AUTH_BASE}/status`,

  // 2FA routes
  INITIATE_LOGIN: `${AUTH_BASE}/initiate-login`,
  VERIFY_2FA: `${AUTH_BASE}/verify-2fa`,
  RESEND_2FA_CODE: `${AUTH_BASE}/resend-2fa-code`,
  TWO_FA_STATUS: `${AUTH_BASE}/2fa-status`,
  CHOOSE_2FA_METHOD: `${AUTH_BASE}/2fa/choose-method`,
  AVAILABLE_METHODS: `${AUTH_BASE}/2fa/available-methods`,

  // 2FA Email
  EMAIL_2FA_ENABLE: `${AUTH_BASE}/2fa/email/enable`,
  EMAIL_2FA_DISABLE: `${AUTH_BASE}/2fa/email/disable`,

  // 2FA SMS
  SMS_2FA_ENABLE: `${AUTH_BASE}/2fa/sms/enable`,
  SMS_2FA_DISABLE: `${AUTH_BASE}/2fa/sms/disable`,

  // 2FA TOTP
  TOTP_2FA_ENABLE: `${AUTH_BASE}/2fa/totp/enable`,
  TOTP_2FA_DISABLE: `${AUTH_BASE}/2fa/totp/disable`,

  // 2FA Backup Codes
  BACKUP_CODES_ENABLE: `${AUTH_BASE}/2fa/backup-codes/enable`,
  BACKUP_CODES_DISABLE: `${AUTH_BASE}/2fa/backup-codes/disable`,
} as const;

// ========== ACCOUNT DOMAIN ==========
const ACCOUNT_BASE = `${API_BASE}/account`;

export const ACCOUNT_ROUTES = {
  BASE: ACCOUNT_BASE,
  SIGNUP: `${ACCOUNT_BASE}/signup`,

  // Activation (public)
  ACTIVATE: `${ACCOUNT_BASE}/activate`,
  RESEND_ACTIVATION: `${ACCOUNT_BASE}/resend-activation`,

  // Reactivation (public)
  REQUEST_REACTIVATION: `${ACCOUNT_BASE}/request-reactivation`,
  CONFIRM_REACTIVATION: `${ACCOUNT_BASE}/confirm-reactivation`,

  // Deactivation (authenticated)
  REQUEST_DEACTIVATION: `${ACCOUNT_BASE}/request-deactivation`,
  CONFIRM_DEACTIVATION: `${ACCOUNT_BASE}/confirm-deactivation`,
} as const;

// ========== PASSWORD DOMAIN ==========
const PASSWORD_BASE = `${API_BASE}/password`;

export const PASSWORD_ROUTES = {
  BASE: PASSWORD_BASE,

  // Public routes
  FORGOT: `${PASSWORD_BASE}/forgot`,
  RESET: `${PASSWORD_BASE}/reset`,
  RESET_RESEND: `${PASSWORD_BASE}/reset/resend`,

  // Authenticated routes
  CHANGE: `${PASSWORD_BASE}/change`,
} as const;

// ========== EMAIL CHANGE DOMAIN ==========
const EMAIL_CHANGE_BASE = `${API_BASE}/email-address-change`;

export const EMAIL_CHANGE_ROUTES = {
  BASE: EMAIL_CHANGE_BASE,
  REQUEST: `${EMAIL_CHANGE_BASE}/request`,
  CANCEL: `${EMAIL_CHANGE_BASE}/cancel`,
  VERIFICATION: `${EMAIL_CHANGE_BASE}/verification`,
  CONFIRMATION: `${EMAIL_CHANGE_BASE}/confirmation`,
} as const;

// ========== DEVICE DOMAIN ==========
const DEVICE_BASE = `${API_BASE}/device`;

export const DEVICE_ROUTES = {
  BASE: DEVICE_BASE,

  // Public routes (email confirmation links)
  CONFIRM: `${DEVICE_BASE}/confirm`,
  REJECT: `${DEVICE_BASE}/reject`,

  // Authenticated routes
  CURRENT: `${DEVICE_BASE}/current`,
  MY_DEVICES: `${DEVICE_BASE}/my-devices`,
  REQUEST_CONFIRMATION: `${DEVICE_BASE}/request-confirmation`,
  DISCONNECT_ALL_OTHERS: `${DEVICE_BASE}/disconnect-all-others`,

  // Dynamic routes with ID
  BY_ID: (deviceId: number) => `${DEVICE_BASE}/${deviceId}`,
  UPDATE_TRUST_LEVEL: (deviceId: number) => `${DEVICE_BASE}/trust-level/${deviceId}`,
  DISCONNECT: (deviceId: number) => `${DEVICE_BASE}/disconnect/${deviceId}`,
} as const;

// ========== PROFILE DOMAIN ==========
const PROFILE_BASE = `${API_BASE}/profile`;

export const PROFILE_ROUTES = {
  BASE: PROFILE_BASE,
  SMS_REQUEST_VERIFICATION: `${PROFILE_BASE}/SMS/request-verification`,
  SMS_VERIFY: `${PROFILE_BASE}/SMS/verify`,
} as const;

// ========== ADMIN DOMAIN ==========
const ADMIN_BASE = `${API_BASE}/admin`;

// Admin - User Management
const ADMIN_USERS_BASE = `${ADMIN_BASE}/users`;

export const ADMIN_USER_ROUTES = {
  BASE: ADMIN_USERS_BASE,
  ALL: `${ADMIN_USERS_BASE}/all`,
  STATS: `${ADMIN_USERS_BASE}/stats`,
  SEARCH: `${ADMIN_USERS_BASE}/search`,
  DEACTIVATION_CATEGORIES: `${ADMIN_USERS_BASE}/deactivation-categories`,

  // Dynamic routes
  ACTIVATE: (userId: number) => `${ADMIN_USERS_BASE}/activate/${userId}`,
  DEACTIVATE: (userId: number) => `${ADMIN_USERS_BASE}/deactivate/${userId}`,
  FORCE_RESET_PASSWORD: (userId: number) => `${ADMIN_USERS_BASE}/force-reset-password/${userId}`,
  GRANT_ROLE: (userId: number) => `${ADMIN_USERS_BASE}/grant-role/${userId}`,
  REVOKE_ROLE: (userId: number) => `${ADMIN_USERS_BASE}/revoke-role/${userId}`,
  GDPR_DELETION: (userId: number) => `${ADMIN_USERS_BASE}/gdpr-deletion/${userId}`,
} as const;

// Admin - Password Management
const ADMIN_PASSWORD_BASE = `${ADMIN_BASE}/password-reset`;

export const ADMIN_PASSWORD_ROUTES = {
  BASE: ADMIN_PASSWORD_BASE,
  SEND_RESET_LINK: (userId: number) => `${ADMIN_PASSWORD_BASE}/send-reset-link/${userId}`,
  SEND_TEMPORARY_PASSWORD: (userId: number) => `${ADMIN_PASSWORD_BASE}/send-temporary-password/${userId}`,
  SEND_VIA_ALTERNATIVE: (userId: number) => `${ADMIN_PASSWORD_BASE}/send-via-alternative-channel/${userId}`,
} as const;

// Admin - Device Management
const ADMIN_DEVICE_BASE = `${ADMIN_BASE}/device`;

export const ADMIN_DEVICE_ROUTES = {
  BASE: ADMIN_DEVICE_BASE,
  LIST_ALL: `${ADMIN_DEVICE_BASE}/list`,
  LIST_BY_USER: (userId: number) => `${ADMIN_DEVICE_BASE}/list/user/${userId}`,
} as const;

// Admin - Cache Management (User)
const ADMIN_CACHE_USER_BASE = `${ADMIN_BASE}/cache/user`;

export const ADMIN_CACHE_USER_ROUTES = {
  BASE: ADMIN_CACHE_USER_BASE,
  STATS: `${ADMIN_CACHE_USER_BASE}/stats`,
  HEALTH: `${ADMIN_CACHE_USER_BASE}/health`,
  CLEANUP: `${ADMIN_CACHE_USER_BASE}/cleanup`,
  MAINTENANCE: `${ADMIN_CACHE_USER_BASE}/maintenance`,
  SECURITY_INCIDENT: `${ADMIN_CACHE_USER_BASE}/security-incident`,
  CONFIG: `${ADMIN_CACHE_USER_BASE}/config`,

  // Dynamic routes
  INVALIDATE_BY_USERNAME: (username: string) => `${ADMIN_CACHE_USER_BASE}/username/${username}`,
  INVALIDATE_BY_ID: (userId: number) => `${ADMIN_CACHE_USER_BASE}/id/${userId}`,
  INVALIDATE_BY_ROLE: (role: string) => `${ADMIN_CACHE_USER_BASE}/role/${role}`,
} as const;

// Admin - Cache Management (Device)
const ADMIN_CACHE_DEVICE_BASE = `${ADMIN_BASE}/cache/device`;

export const ADMIN_CACHE_DEVICE_ROUTES = {
  BASE: ADMIN_CACHE_DEVICE_BASE,
  STATS: `${ADMIN_CACHE_DEVICE_BASE}/stats`,
  CLEANUP: `${ADMIN_CACHE_DEVICE_BASE}/cleanup`,

  // Dynamic routes
  INVALIDATE: (deviceId: number) => `${ADMIN_CACHE_DEVICE_BASE}/${deviceId}`,
} as const;

// Admin - Security Logs
const ADMIN_SECURITY_BASE = `${API_BASE}/security/logs`;

export const ADMIN_SECURITY_ROUTES = {
  BASE: ADMIN_SECURITY_BASE,
  USER_LOGS: (userId: number) => `${ADMIN_SECURITY_BASE}/user/${userId}`,
} as const;

// ========== AGGREGATED ROUTES ==========

/**
 * Aggregated admin routes for convenience
 */
export const ADMIN_ROUTES = {
  USER: ADMIN_USER_ROUTES,
  PASSWORD: ADMIN_PASSWORD_ROUTES,
  DEVICE: ADMIN_DEVICE_ROUTES,
  CACHE_USER: ADMIN_CACHE_USER_ROUTES,
  CACHE_DEVICE: ADMIN_CACHE_DEVICE_ROUTES,
  SECURITY: ADMIN_SECURITY_ROUTES,
} as const;

/**
 * All API routes aggregated
 */
export const API_ROUTES = {
  AUTH: AUTH_ROUTES,
  ACCOUNT: ACCOUNT_ROUTES,
  PASSWORD: PASSWORD_ROUTES,
  EMAIL_CHANGE: EMAIL_CHANGE_ROUTES,
  DEVICE: DEVICE_ROUTES,
  PROFILE: PROFILE_ROUTES,
  ADMIN: ADMIN_ROUTES,
} as const;

// ========== UTILITY FUNCTIONS ==========

// ========== FRONTEND ROUTES ==========

/**
 * Routes frontend (pages Angular)
 */
const FRONTEND_BASE = '';

export const FRONTEND_ROUTES = {
  HOME: '/',

  // Auth pages
  AUTH_BASE: '/auth',
  AUTH_LOGIN: '/auth/login',
  AUTH_SIGNUP: '/auth/signup',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  AUTH_ACCOUNT_CONFIRMATION: '/auth/account-confirmation',
  AUTH_DEVICE_CONFIRMATION: '/auth/device-confirmation',
  AUTH_DEVICE_REJECTION: '/auth/device-rejection',

  // Protected pages
  PROFILE: '/profile',
  DEVICES: '/devices',
  ADMIN: '/admin',
} as const;

// ========== PUBLIC ROUTES CONFIGURATION ==========

/**
 * Routes d'API publiques (pas d'authentification requise)
 * Ces routes ne déclenchent pas de redirection vers login en cas d'erreur 401/403
 *
 * ⚠️ SYNCHRONISÉ avec SecurityConstants.java PUBLIC_ROUTES
 */
export const PUBLIC_API_ROUTES = [
  // Auth public routes
  AUTH_ROUTES.LOGIN,
  AUTH_ROUTES.INITIATE_LOGIN,
  AUTH_ROUTES.VERIFY_2FA,
  AUTH_ROUTES.RESEND_2FA_CODE,
  AUTH_ROUTES.TWO_FA_STATUS,
  AUTH_ROUTES.REFRESH_TOKEN,
  AUTH_ROUTES.CHOOSE_2FA_METHOD,

  // Account public routes
  ACCOUNT_ROUTES.SIGNUP,
  ACCOUNT_ROUTES.ACTIVATE,
  ACCOUNT_ROUTES.RESEND_ACTIVATION,
  ACCOUNT_ROUTES.REQUEST_REACTIVATION,
  ACCOUNT_ROUTES.CONFIRM_REACTIVATION,

  // Password public routes
  PASSWORD_ROUTES.FORGOT,
  PASSWORD_ROUTES.RESET,
  PASSWORD_ROUTES.RESET_RESEND,

  // Email change public routes
  EMAIL_CHANGE_ROUTES.CANCEL,
  EMAIL_CHANGE_ROUTES.VERIFICATION,
  EMAIL_CHANGE_ROUTES.CONFIRMATION,

  // Device public routes
  DEVICE_ROUTES.CONFIRM,
  DEVICE_ROUTES.REJECT,

  // Debug routes (à désactiver en production)
  '/api/debug',
  '/api/test/device-security',
] as const;

/**
 * Routes frontend publiques (accessibles sans authentification)
 * Ces routes ne tentent pas de rafraîchir le token
 */
export const PUBLIC_FRONTEND_ROUTES = [
  FRONTEND_ROUTES.HOME,
  FRONTEND_ROUTES.AUTH_LOGIN,
  FRONTEND_ROUTES.AUTH_SIGNUP,
  FRONTEND_ROUTES.AUTH_FORGOT_PASSWORD,
  FRONTEND_ROUTES.AUTH_RESET_PASSWORD,
  FRONTEND_ROUTES.AUTH_ACCOUNT_CONFIRMATION,
  FRONTEND_ROUTES.AUTH_DEVICE_CONFIRMATION,
  FRONTEND_ROUTES.AUTH_DEVICE_REJECTION,
] as const;

/**
 * Vérifie si une URL correspond à une route d'API publique
 */
export function isPublicApiRoute(url: string): boolean {
  return PUBLIC_API_ROUTES.some(route => {
    if (url === route) return true;
    if (url.startsWith(route + '/')) return true;
    if (url.startsWith(route + '?')) return true;
    return false;
  });
}

/**
 * Vérifie si une URL de page frontend est publique
 */
export function isPublicFrontendRoute(url: string): boolean {
  return PUBLIC_FRONTEND_ROUTES.some(route => {
    if (url === route) return true;
    if (url.startsWith(route + '/') || url.startsWith(route + '?')) return true;
    return false;
  });
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Helper function to build query strings
 * Usage: buildQueryString({ page: 0, size: 20, sort: 'id,asc' })
 * Returns: '?page=0&size=20&sort=id,asc'
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return filtered ? `?${filtered}` : '';
}
