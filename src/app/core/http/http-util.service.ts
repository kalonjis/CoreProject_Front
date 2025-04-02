import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpUtilService {
  constructor(private http: HttpClient) {}

  // Méthode générique pour les requêtes GET
  get<T>(url: string, skipInterceptor: boolean = false): Observable<T> {
    const options = this.createOptions(skipInterceptor);
    return this.http.get<T>(url, options);
  }

  // Méthode générique pour les requêtes POST
  post<T>(url: string, body: any, skipInterceptor: boolean = false): Observable<T> {
    const options = this.createOptions(skipInterceptor);
    return this.http.post<T>(url, body, options);
  }

  // Méthode générique pour les requêtes PUT
  put<T>(url: string, body: any, skipInterceptor: boolean = false): Observable<T> {
    const options = this.createOptions(skipInterceptor);
    return this.http.put<T>(url, body, options);
  }

  // Méthode générique pour les requêtes PATCH
  patch<T>(url: string, body: any, skipInterceptor: boolean = false): Observable<T> {
    const options = this.createOptions(skipInterceptor);
    return this.http.patch<T>(url, body, options);
  }

  // Méthode générique pour les requêtes DELETE
  delete<T>(url: string, skipInterceptor: boolean = false): Observable<T> {
    const options = this.createOptions(skipInterceptor);
    return this.http.delete<T>(url, options);
  }

  // Méthode privée pour créer les options HTTP avec ou sans l'en-tête X-Skip-Interceptor
  private createOptions(skipInterceptor: boolean): { headers?: HttpHeaders } {
    if (skipInterceptor) {
      return { headers: new HttpHeaders().set('X-Skip-Interceptor', 'true') };
    }
    return {};
  }
}
