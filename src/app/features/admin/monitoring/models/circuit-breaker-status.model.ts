// src/app/features/admin/monitoring/models/circuit-breaker-status.model.ts

/**
 * Possible states of a Circuit Breaker.
 */
export type CircuitBreakerState =
  | 'CLOSED'
  | 'OPEN'
  | 'HALF_OPEN'
  | 'DISABLED'
  | 'FORCED_OPEN'
  | 'METRICS_ONLY';

/**
 * Circuit Breaker status returned by the monitoring API.
 * Maps to: GET /api/monitoring/circuit-breakers
 *
 * Matches CircuitBreakerStatusResponse.java
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
  bufferedCalls: number;

  /** Number of failed calls in the sliding window */
  failedCalls: number;

  /** Number of successful calls in the sliding window */
  successfulCalls: number;

  /** Number of calls rejected because circuit was open */
  notPermittedCalls: number;
}

/**
 * Response from POST /api/admin/circuit-breaker/{name}/reset (and similar actions)
 */
export interface CircuitBreakerActionResponse {
  message: string;
  newState: CircuitBreakerState;
}
