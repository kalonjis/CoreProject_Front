import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Service de protection contre les attaques XSS
 * Fournit des méthodes pour nettoyer le contenu potentiellement dangereux
 */
@Injectable({
  providedIn: 'root'
})
export class XssSanitizerService {
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Nettoie une chaîne HTML et la convertit en SafeHtml
   */
  public sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.basicSanitize(html));
  }

  /**
   * Nettoie une chaîne de texte de base sans utiliser SafeHtml
   */
  public sanitizeText(text: string): string {
    return this.basicSanitize(text);
  }

  /**
   * Sanitisation basique pour les entrées utilisateur
   */
  private basicSanitize(input: string): string {
    if (!input) return '';

    // Échapper les caractères spéciaux HTML
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
