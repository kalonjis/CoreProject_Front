// src/app/features/admin/models/health-status.model.ts

import {CircuitBreakerState} from './circuit-breaker-status.model';

/**
 * Possible health statuses from Spring Boot Actuator.
 */
export type HealthStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'RECOVERING' | 'WARNING' | 'UNKNOWN';

/**
 * Individual health component details.
 * Each component (db, rabbit, mail, etc.) reports its status.
 */
export interface HealthComponent {
  /** Component health status */
  status: HealthStatus;

  /** Additional details specific to the component */
  details?: Record<string, unknown>;
}

/**
 * Database health component details.
 */
export interface DatabaseHealthDetails {
  database: string;
  validationQuery: string;
}

/**
 * Disk space health component details.
 */
export interface DiskSpaceHealthDetails {
  total: number;
  free: number;
  threshold: number;
  path: string;
  exists: boolean;
}

/**
 * Email system health component details.
 * Custom health indicator from EmailHealthIndicator.
 */
export interface EmailSystemHealthDetails {
  circuitBreaker: CircuitBreakerState;
  failureRate: string;
  pendingRetries: number;
  currentlyRetrying: number;
  permanentlyFailed: number;
  message?: string;
}

/**
 * RabbitMQ health component details.
 */
export interface RabbitHealthDetails {
  version: string;
}

/**
 * Full health response from GET /actuator/health.
 */
export interface HealthResponse {
  /** Overall application health status */
  status: HealthStatus;

  /** Individual component health statuses */
  components?: {
    db?: HealthComponent & { details?: DatabaseHealthDetails };
    diskSpace?: HealthComponent & { details?: DiskSpaceHealthDetails };
    emailSystem?: HealthComponent & { details?: EmailSystemHealthDetails };
    rabbit?: HealthComponent & { details?: RabbitHealthDetails };
    ping?: HealthComponent;
    circuitBreakers?: HealthComponent & {
      details?: Record<string, { state: string; failureRate: string }>;
    };
    [key: string]: HealthComponent | undefined;
  };
}

// Import for EmailSystemHealthDetails
