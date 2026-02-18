// src/app/features/admin/monitoring/services/smtp-health-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Response from SMTP health test endpoint.
 */
export interface SmtpHealthResponse {
  /** True if SMTP server responded successfully to connection test */
  reachable: boolean;

  /** Time taken to complete the test in milliseconds */
  responseTimeMs: number;

  /** Error description if test failed, null otherwise */
  errorMessage: string | null;
}

/**
 * API service for SMTP health monitoring.
 *
 * Provides access to SMTP connectivity testing without sending actual emails.
 * Used by the System Health dashboard to display real-time SMTP status.
 *
 * @example
 * ```typescript
 * smtpHealthApi.testConnection().subscribe(result => {
 *   if (result.reachable) {
 *     console.log(`SMTP OK in ${result.responseTimeMs}ms`);
 *   } else {
 *     console.error(`SMTP failed: ${result.errorMessage}`);
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SmtpHealthApiService {

  private readonly http = inject(HttpClient);

  /** Base URL for SMTP health endpoints */
  private readonly baseUrl = '/api/monitoring';

  /**
   * Tests SMTP server connectivity.
   *
   * Performs a connection test to the configured SMTP server by executing
   * EHLO/AUTH handshake without sending an actual email.
   *
   * @returns Observable with test results including reachability and response time
   */
  testConnection(): Observable<SmtpHealthResponse> {
    return this.http.get<SmtpHealthResponse>(`${this.baseUrl}/smtp/test`);
  }
}
