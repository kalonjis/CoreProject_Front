// Configuration des routes publiques qui ne nécessitent pas d'authentification

/**
 * Liste des préfixes d'URL pour les API publiques qui ne doivent pas déclencher
 * de redirection vers la page de connexion en cas d'erreur 401/403
 */
export const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/refresh-token',
  '/api/auth/logout',
  '/api/auth/signup',
  '/api/account-confirmation/',  // Activation du compte
  '/api/device/confirm',         // Confirmation d'appareil
  '/api/device/reject',          // Rejet d'appareil
  '/api/password/',              // Gestion des mots de passe publics
];

/**
 * Liste des routes frontend qui sont accessibles sans authentification
 * et qui ne doivent pas tenter de rafraîchir le token
 */
export const PUBLIC_FRONTEND_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/account-confirmation',
  '/auth/device-confirmation',
  '/'  // Page d'accueil
];

/**
 * Vérifie si une URL est une route d'API publique
 */
export function isPublicApiRoute(url: string): boolean {
  return PUBLIC_API_ROUTES.some(route => url.includes(route));
}

/**
 * Vérifie si une URL de page est publique (ne nécessite pas d'authentification)
 */
export function isPublicFrontendRoute(url: string): boolean {
  return PUBLIC_FRONTEND_ROUTES.some(route =>
    // Gestion exacte ou préfixe
    url === route || url.startsWith(`${route}/`)
  );
}
