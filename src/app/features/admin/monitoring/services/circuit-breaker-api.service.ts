// src/app/features/admin/system-health/services/circuit-breaker-api.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {CircuitBreakerActionResponse, CircuitBreakerStatus, CircuitBreakerStatusResponse} from '../models';


/**
 * API service for Circuit Breaker admin operations.
 *
 * Provides access to:
 * - Circuit breaker status monitoring
 * - Manual circuit breaker control (reset, force open, force close)
 *
 * All endpoints require ADMIN or SUPER_ADMIN authority.
 * Used by the Circuit Breaker card in System Health dashboard.
 */
@Injectable({
  providedIn: 'root'
})
export class CircuitBreakerApiService {

  private readonly http = inject(HttpClient);

  /** Base URL for circuit breaker admin endpoints */
  private readonly baseUrl = `api/admin/circuit-breaker`;

  // ===========================================================================
  // STATUS ENDPOINTS
  // ===========================================================================

  /**
   * Retrieves status of all circuit breakers.
   * GET /api/admin/circuit-breaker/status
   *
   * @returns Observable with array of CircuitBreakerStatus
   */
  getAll(): Observable<CircuitBreakerStatus[]> {
    return this.http.get<CircuitBreakerStatusResponse>(`${this.baseUrl}/status`).pipe(
      map(response => this.mapResponse(response))
    );
  }

  /**
   * Retrieves status of a specific circuit breaker.
   * GET /api/admin/circuit-breaker/{name}/status
   *
   * @param name Circuit breaker name (e.g., 'smtpBackend', 'twilioBackend')
   * @returns Observable with CircuitBreakerStatus
   */
  getByName(name: string): Observable<CircuitBreakerStatus> {
    return this.http.get<CircuitBreakerStatus>(`${this.baseUrl}/${name}/status`);
  }

  // ===========================================================================
  // ACTION ENDPOINTS
  // ===========================================================================

  /**
   * Resets a circuit breaker to CLOSED state.
   * Clears all metrics and returns to normal operation.
   * POST /api/admin/circuit-breaker/{name}/reset
   *
   * @param name Circuit breaker name
   * @returns Observable with action response
   */
  reset(name: string): Observable<CircuitBreakerActionResponse> {
    return this.http.post<CircuitBreakerActionResponse>(
      `${this.baseUrl}/${name}/reset`,
      {}
    );
  }

  /**
   * Forces a circuit breaker to OPEN state.
   * All calls will be rejected until manually closed or reset.
   * Use for maintenance or testing.
   * POST /api/admin/circuit-breaker/{name}/open
   *
   * @param name Circuit breaker name
   * @returns Observable with action response
   */
  forceOpen(name: string): Observable<CircuitBreakerActionResponse> {
    return this.http.post<CircuitBreakerActionResponse>(
      `${this.baseUrl}/${name}/open`,
      {}
    );
  }

  /**
   * Forces a circuit breaker to CLOSED state.
   * Resumes normal operation immediately.
   * POST /api/admin/circuit-breaker/{name}/close
   *
   * @param name Circuit breaker name
   * @returns Observable with action response
   */
  forceClose(name: string): Observable<CircuitBreakerActionResponse> {
    return this.http.post<CircuitBreakerActionResponse>(
      `${this.baseUrl}/${name}/close`,
      {}
    );
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Maps the raw API response to an array of CircuitBreakerStatus.
   *
   * @param response Raw response from API (Record<name, status>)
   * @returns Array of CircuitBreakerStatus with name included
   */
  private mapResponse(response: CircuitBreakerStatusResponse): CircuitBreakerStatus[] {
    return Object.entries(response).map(([name, status]) => ({
      name,
      state: status.state,
      failureRate: status.failureRate,
      slowCallRate: status.slowCallRate,
      numberOfBufferedCalls: status.numberOfBufferedCalls,
      numberOfFailedCalls: status.numberOfFailedCalls,
      numberOfSuccessfulCalls: status.numberOfSuccessfulCalls,
      numberOfSlowCalls: status.numberOfSlowCalls,
      numberOfNotPermittedCalls: status.numberOfNotPermittedCalls
    }));
  }
}
