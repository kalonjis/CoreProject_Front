import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {map, Observable, of} from 'rxjs';

/**
 * Service pour générer une empreinte unique d'appareil, utilisée pour
 * renforcer la détection d'appareils côté client
 */
@Injectable({
  providedIn: 'root'
})
export class DeviceFingerprintService {
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  /**
   * Génère une empreinte d'appareil basée sur diverses caractéristiques du navigateur
   */
  public generateFingerprint(): Observable<string> {
    if (!isPlatformBrowser(this.platformId)) {
      return of('server-side-rendering');
    }

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      // Ajouter d'autres propriétés qui peuvent aider à identifier l'appareil
    };

    // Envoi au serveur pour traitement cryptographique
    return this.http.post<{ fingerprint: string }>('/api/device/fingerprint', fingerprint)
      .pipe(map(response => response.fingerprint));
  }

  /**
   * Génère une empreinte simple côté client (moins sécurisée mais plus rapide)
   */
  public generateSimpleFingerprint(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return 'server-side-rendering';
    }

    const components = [
      navigator.userAgent,
      navigator.language,
      `${window.screen.width}x${window.screen.height}`,
      window.screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.platform
    ];

    // Simple hachage des composants
    return this.simpleHash(components.join('|'));
  }

  /**
   * Fonction de hachage simple pour générer une empreinte
   * Note: Pour une solution de production, utiliser une bibliothèque dédiée comme FingerprintJS
   */
  private simpleHash(input: string): string {
    let hash = 0;
    if (input.length === 0) return hash.toString(16);

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Conversion en 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }
}
