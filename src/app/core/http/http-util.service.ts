import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SKIP_AUTH_INTERCEPTOR } from './http.context';

interface HttpOptions {
  context?: HttpContext;
  withCredentials: boolean;
}

/**
 * HttpUtilService - Utility wrapper for HttpClient.
 *
 * Features:
 * - Always includes withCredentials: true (for httpOnly cookies)
 * - Option to skip auth interceptor using HttpContext (Angular modern approach)
 */
@Injectable({ providedIn: 'root' })
export class HttpUtilService {

  private readonly http = inject(HttpClient);

  get<T>(url: string, skipInterceptor = false): Observable<T> {
    return this.http.get<T>(url, this.createOptions(skipInterceptor));
  }

  post<T>(url: string, body: unknown, skipInterceptor = false): Observable<T> {
    return this.http.post<T>(url, body, this.createOptions(skipInterceptor));
  }

  put<T>(url: string, body: unknown, skipInterceptor = false): Observable<T> {
    return this.http.put<T>(url, body, this.createOptions(skipInterceptor));
  }

  patch<T>(url: string, body: unknown, skipInterceptor = false): Observable<T> {
    return this.http.patch<T>(url, body, this.createOptions(skipInterceptor));
  }

  delete<T>(url: string, skipInterceptor = false): Observable<T> {
    return this.http.delete<T>(url, this.createOptions(skipInterceptor));
  }

  private createOptions(skipInterceptor: boolean): HttpOptions {
    const options: HttpOptions = { withCredentials: true };

    if (skipInterceptor) {
      options.context = new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true);
    }

    return options;
  }
}
