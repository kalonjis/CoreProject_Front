import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * Service pour configurer et gérer les politiques de sécurité du contenu (CSP)
 */
@Injectable({
  providedIn: 'root'
})
export class ContentSecurityService {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  /**
   * Configure une politique CSP stricte via meta tag
   * Note: Idéalement, la CSP devrait être configurée côté serveur via des en-têtes HTTP
   */
  public setupStrictCsp(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const cspContent = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'", // 'unsafe-inline' pour les styles inline Angular
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.your-domain.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');

    const meta = this.document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', cspContent);
    this.document.head.appendChild(meta);
  }
}
