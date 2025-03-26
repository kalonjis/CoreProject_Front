import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service de gestion des cookies sécurisés
 * Encapsule les opérations sur les cookies pour une meilleure sécurité et testabilité
 */
@Injectable({
  providedIn: 'root'
})
export class CookieService {
  /**
   * Récupère un cookie par son nom
   * @param name Nom du cookie
   * @returns Valeur du cookie ou null si non trouvé
   */
  getCookie(name: string): string | null {
    // Version Debug - Liste tous les cookies
    console.log('All cookies:', document.cookie);

    const cookieValue = this.getCookieValue(name);
    console.log(`Recherche du cookie '${name}':`, cookieValue ? 'trouvé' : 'non trouvé');
    return cookieValue;
  }

  /**
   * Vérifie si un cookie existe
   * @param name Nom du cookie
   * @returns true si le cookie existe
   */
  hasCookie(name: string): boolean {
    // Version Debug - Liste tous les cookies
    const allCookies = document.cookie;
    console.log('Vérification cookie, tous les cookies:', allCookies);

    // Vérification directe dans la chaîne complète des cookies
    const quickCheck = allCookies.includes(name + '=');

    // Vérification plus précise
    const hasValue = this.getCookieValue(name) !== null;

    console.log(`Vérification du cookie '${name}':`,
      quickCheck ? 'présent (vérification rapide)' : 'absent (vérification rapide)',
      hasValue ? 'présent (valeur trouvée)' : 'absent (valeur non trouvée)');

    return hasValue;
  }

  /**
   * Définit un cookie
   * @param name Nom du cookie
   * @param value Valeur du cookie
   * @param expirationDays Jours avant expiration
   * @param path Chemin du cookie
   */
  setCookie(name: string, value: string, expirationDays: number = 7, path: string = '/'): void {
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=${path}`;
    console.log(`Cookie '${name}' défini avec expiration dans ${expirationDays} jours`);
  }

  /**
   * Supprime un cookie
   * @param name Nom du cookie à supprimer
   * @param path Chemin du cookie
   */
  deleteCookie(name: string, path: string = '/'): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
    console.log(`Cookie '${name}' supprimé`);
  }

  /**
   * Méthode interne pour extraire la valeur d'un cookie
   */
  private getCookieValue(name: string): string | null {
    // Méthode standard de recherche de cookie
    const cookieArr = document.cookie.split(';');

    // Parcourir chaque cookie et trouver celui qui correspond au nom recherché
    for (const cookie of cookieArr) {
      const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());

      // Debug pour chaque cookie examiné
      console.log(`Examen cookie: '${cookieName}' = '${cookieValue}'`);

      if (cookieName === name) {
        return cookieValue;
      }
    }

    // Méthode alternative si la première échoue
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' +
      name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));

    return match ? match[1] : null;
  }
}
