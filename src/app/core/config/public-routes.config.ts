/**
 * Configuration des routes publiques synchronisée avec SecurityConstants.java
 *
 * ⚠️ IMPORTANT: Ces routes doivent correspondre exactement à PUBLIC_ROUTES du backend
 */

import {
  AUTH_ROUTES,
  ACCOUNT_ROUTES,
  PASSWORD_ROUTES,
  DEVICE_ROUTES,
  EMAIL_CHANGE_ROUTES
} from './api-routes.constants';

/**
 * Routes d'API publiques (pas d'authentification requise)
 * Ces routes ne déclenchent pas de redirection vers login en cas d'erreur 401/403
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

  // Account public routes (activation/reactivation)
  ACCOUNT_ROUTES.SIGNUP,
  ACCOUNT_ROUTES.ACTIVATE,           // Préfixe pour /api/account/activate/**
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

  // Device public routes (email confirmation links)
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
  '/',                              // Page d'accueil
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/account-confirmation',     // Activation de compte
  '/auth/device-confirmation',      // Confirmation d'appareil
  '/auth/device-rejection',         // Rejet d'appareil
] as const;

/**
 * Vérifie si une URL correspond à une route d'API publique
 * Utilise une vérification par préfixe pour gérer les routes dynamiques (avec tokens, IDs, etc.)
 *
 * @param url URL à vérifier
 * @returns true si l'URL est une route d'API publique
 */
export function isPublicApiRoute(url: string): boolean {
  return PUBLIC_API_ROUTES.some(route => {
    // Gestion exacte
    if (url === route) return true;

    // Gestion des préfixes pour routes dynamiques
    // Ex: /api/account/activate/xyz123 matche /api/account/activate
    if (url.startsWith(route + '/')) return true;

    // Gestion des query params
    // Ex: /api/password/reset?token=xyz matche /api/password/reset
    if (url.startsWith(route + '?')) return true;

    return false;
  });
}

/**
 * Vérifie si une URL de page frontend est publique
 * Ces routes ne nécessitent pas d'authentification
 *
 * @param url URL de la page à vérifier
 * @returns true si l'URL est une route frontend publique
 */
export function isPublicFrontendRoute(url: string): boolean {
  return PUBLIC_FRONTEND_ROUTES.some(route => {
    // Gestion exacte
    if (url === route) return true;

    // Gestion des préfixes avec paramètres
    // Ex: /auth/login?redirect=/dashboard matche /auth/login
    if (url.startsWith(route + '/') || url.startsWith(route + '?')) return true;

    return false;
  });
}

/**
 * Vérifie si une URL nécessite une authentification
 * Inverse de isPublicApiRoute
 *
 * @param url URL à vérifier
 * @returns true si l'URL nécessite une authentification
 */
export function requiresAuthentication(url: string): boolean {
  return !isPublicApiRoute(url);
}

/**
 * Extrait le chemin de base d'une URL (sans query params ni fragments)
 * Utile pour la vérification des routes
 *
 * @param url URL complète
 * @returns Chemin de base sans query params
 */
export function extractBasePath(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname;
  } catch {
    // Si URL invalide, retirer manuellement query params
    return url.split('?')[0].split('#')[0];
  }
}
