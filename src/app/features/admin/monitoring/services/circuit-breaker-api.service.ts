// src/app/features/admin/monitoring/services/circuit-breaker-api.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CircuitBreakerStatus } from '../models';

/**
 * API service for Circuit Breaker monitoring operations.
 *
 * Provides access to:
 * - Circuit breaker status monitoring
 * - Manual circuit breaker control (reset, force open, force close)
 *
 * Uses:
 * - /api/monitoring/circuit-breakers for read operations
 * - /api/admin/circuit-breaker for admin actions (reset, open, close)
 */
@Injectable({
  providedIn: 'root'
})
export class CircuitBreakerApiService {

  private readonly http = inject(HttpClient);

  /** Monitoring endpoint (read-only) */
  private readonly monitoringUrl = `/api/monitoring/circuit-breakers`;

  /** Admin endpoint (actions) */
  private readonly adminUrl = `/api/admin/circuit-breaker`;

  // ===========================================================================
  // STATUS ENDPOINTS (via MonitoringController)
  // ===========================================================================

  /**
   * Retrieves status of all circuit breakers.
   * GET /api/monitoring/circuit-breakers
   *
   * @returns Observable with array of CircuitBreakerStatus
   */
  getAll(): Observable<CircuitBreakerStatus[]> {
    return this.http.get<CircuitBreakerStatus[]>(this.monitoringUrl);
  }

  /**
   * Retrieves status of a specific circuit breaker.
   * GET /api/monitoring/circuit-breakers/{name}
   *
   * @param name Circuit breaker name (e.g., 'smtpBackend', 'twilioBackend')
   * @returns Observable with CircuitBreakerStatus
   */
  getByName(name: string): Observable<CircuitBreakerStatus> {
    return this.http.get<CircuitBreakerStatus>(`${this.monitoringUrl}/${name}`);
  }

  // ===========================================================================
  // ACTION ENDPOINTS (via CircuitBreakerAdminController)
  // ===========================================================================

  /**
   * Resets a circuit breaker to CLOSED state.
   * POST /api/admin/circuit-breaker/{name}/reset
   */
  reset(name: string): Observable<CircuitBreakerActionResponse> {
    return this.http.post<CircuitBreakerActionResponse>(
      `${this.adminUrl}/${name}/reset`,
      {}
    );
  }

  /**
   * Forces a circuit breaker to OPEN state.
   * POST /api/admin/circuit-breaker/{name}/open
   */
  forceOpen(name: string): Observable<CircuitBreakerActionResponse> {
    return this.http.post<CircuitBreakerActionResponse>(
      `${this.adminUrl}/${name}/open`,
      {}
    );
  }

  /**
   * Forces a circuit breaker to CLOSED state.
   * POST /api/admin/circuit-breaker/{name}/close
   */
  forceClose(name: string): Observable<CircuitBreakerActionResponse> {
    return this.http.post<CircuitBreakerActionResponse>(
      `${this.adminUrl}/${name}/close`,
      {}
    );
  }
}

// ===========================================================================
// RESPONSE INTERFACES
// ===========================================================================

/**
 * Response from circuit breaker action endpoints.
 */
interface CircuitBreakerActionResponse {
  message: string;
  newState: string;
}
