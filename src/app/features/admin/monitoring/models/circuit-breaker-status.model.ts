// src/app/features/admin/models/circuit-breaker-status.model.ts

/**
 * Possible states of a Circuit Breaker.
 *
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is tripped, requests are blocked (fail-fast)
 * - HALF_OPEN: Testing phase, limited requests allowed to check recovery
 * - DISABLED: Circuit breaker is disabled
 * - FORCED_OPEN: Manually forced open by admin
 * - METRICS_ONLY: Only collecting metrics, not blocking
 */
export type CircuitBreakerState =
  | 'CLOSED'
  | 'OPEN'
  | 'HALF_OPEN'
  | 'DISABLED'
  | 'FORCED_OPEN'
  | 'METRICS_ONLY';

/**
 * Circuit Breaker status returned by the admin API.
 * Maps to: GET /api/admin/circuit-breaker/status
 */
export interface CircuitBreakerStatus {
  /** Circuit breaker name (e.g., 'smtpBackend', 'twilioBackend') */
  name: string;

  /** Current state of the circuit breaker */
  state: CircuitBreakerState;

  /** Failure rate percentage (0-100), -1 if not enough calls */
  failureRate: number;

  /** Slow call rate percentage (0-100), -1 if not enough calls */
  slowCallRate: number;

  /** Number of calls currently in the sliding window */
  numberOfBufferedCalls: number;

  /** Number of failed calls in the sliding window */
  numberOfFailedCalls: number;

  /** Number of successful calls in the sliding window */
  numberOfSuccessfulCalls: number;

  /** Number of slow calls in the sliding window */
  numberOfSlowCalls: number;

  /** Number of calls rejected because circuit was open */
  numberOfNotPermittedCalls: number;
}

/**
 * Response from GET /api/admin/circuit-breaker/status
 * Returns a map of circuit breaker name to status.
 */
export type CircuitBreakerStatusResponse = Record<string, Omit<CircuitBreakerStatus, 'name'>>;

/**
 * Response from POST /api/admin/circuit-breaker/{name}/reset (and similar actions)
 */
export interface CircuitBreakerActionResponse {
  message: string;
  newState: CircuitBreakerState;
}
