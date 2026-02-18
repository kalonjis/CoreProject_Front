// src/app/features/admin/monitoring/services/twilio-health-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Response from Twilio health test endpoint.
 */
export interface TwilioHealthResponse {
  /** True if Twilio API responded successfully to connection test */
  reachable: boolean;

  /** Time taken to complete the test in milliseconds */
  responseTimeMs: number;

  /** Twilio account status (active, suspended, closed) if reachable */
  accountStatus: string | null;

  /** Error description if test failed, null otherwise */
  errorMessage: string | null;
}

/**
 * API service for Twilio health monitoring.
 *
 * Provides access to Twilio connectivity testing without sending actual SMS.
 * Used by the System Health dashboard to display real-time Twilio status.
 *
 * @example
 * ```typescript
 * twilioHealthApi.testConnection().subscribe(result => {
 *   if (result.reachable) {
 *     console.log(`Twilio OK in ${result.responseTimeMs}ms - ${result.accountStatus}`);
 *   } else {
 *     console.error(`Twilio failed: ${result.errorMessage}`);
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class TwilioHealthApiService {

  private readonly http = inject(HttpClient);

  /** Base URL for Twilio health endpoints */
  private readonly baseUrl = '/api/monitoring/twilio';

  /**
   * Tests Twilio API connectivity.
   *
   * Fetches account information from Twilio to validate connectivity
   * and credentials without sending an actual SMS.
   *
   * @returns Observable with test results including reachability and response time
   */
  testConnection(): Observable<TwilioHealthResponse> {
    return this.http.get<TwilioHealthResponse>(`${this.baseUrl}/test`);
  }
}
