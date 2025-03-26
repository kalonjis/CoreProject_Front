import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

/**
 * Service de protection CSRF pour les applications à fort besoin de sécurité
 * Permet de récupérer et stocker un token CSRF pour les requêtes sensibles
 */
@Injectable({
  providedIn: 'root'
})
export class CsrfProtectionService {
  private http = inject(HttpClient);
  private csrfToken: string | null = null;

  /**
   * Récupère un token CSRF depuis le serveur
   */
  public getCsrfToken(): Observable<string> {
    if (this.csrfToken) {
      return new Observable(observer => {
        if (this.csrfToken != null) {
          observer.next(this.csrfToken);
        }
        observer.complete();
      });
    }

    return this.http.get<{ token: string }>('/api/csrf-token').pipe(
      map(response => {
        this.csrfToken = response.token;
        return this.csrfToken;
      }),
      shareReplay(1)
    );
  }

  /**
   * Ajoute le token CSRF aux données d'une requête
   */
  public addCsrfToken<T>(data: T): Observable<T & { _csrf: string }> {
    return this.getCsrfToken().pipe(
      map(token => ({ ...data as object, _csrf: token } as T & { _csrf: string }))
    );
  }
}
