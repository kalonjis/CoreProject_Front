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
  private platformId = inject(PLATFORM_ID);

  /**
   * Vérifie si un cookie existe
   */
  public hasCookie(name: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName] = cookie.trim().split('=');
      if (cookieName === name) {
        return true;
      }
    }
    return false;
  }

  /**
   * Récupère la valeur d'un cookie
   */
  public getCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }

  /**
   * Supprime un cookie
   * Note: Les cookies sont gérés par le backend, mais cette méthode peut être utile pour des tests
   */
  public deleteCookie(name: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; SameSite=Strict;`;
  }

  /**
   * Écoute les changements de cookies (utile pour la synchronisation entre onglets)
   * @param callback Fonction à exécuter quand les cookies changent
   */
  public onCookieChange(callback: () => void): () => void {
    if (!isPlatformBrowser(this.platformId)) {
      return () => {}; // Retourne une fonction vide pour SSR
    }

    const cookieObserver = new MutationObserver(() => {
      callback();
    });

    // Observer le changement d'attributs sur document.cookie (technique indirecte)
    cookieObserver.observe(document, {
      attributes: true,
      childList: false,
      subtree: false
    });

    // Retourne une fonction de nettoyage
    return () => cookieObserver.disconnect();
  }
}
