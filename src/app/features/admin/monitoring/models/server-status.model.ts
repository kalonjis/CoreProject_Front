// src/app/features/admin/monitoring/models/server-status.model.ts

import { HealthStatus } from './health-status.model';
import { ExecutorMetrics } from './executor-metrics.model';

/**
 * Simplified server/service status for display.
 * Aggregated from actuator health data.
 */
export interface ServerStatus {
  /** Service identifier */
  id: string;

  /** Display name */
  name: string;

  /** Current status */
  status: HealthStatus;

  /** Icon for display (emoji or icon class) */
  icon: string;

  /** Optional status message */
  message?: string;

  /** Last check timestamp */
  lastChecked?: Date;
}

/**
 * Health metrics for display.
 * Aggregated from actuator metrics.
 */
export interface HealthMetrics {
  /** JVM heap memory usage */
  jvm: {
    heapUsed: number;
    heapMax: number;
    heapUsedPercent: number;
  };

  /** System CPU usage */
  cpu: {
    systemUsage: number;
    processUsage: number;
  };

  /** Disk space */
  disk: {
    free: number;
    total: number;
    freePercent: number;
  };

  /** Database connection pool */
  dbPool: {
    active: number;
    idle: number;
    max: number;
  };

  /** Async executor thread pools */
  executors: ExecutorMetrics[];

  /** Application uptime in seconds */
  uptime: number;
}

/**
 * Aggregated system health data for the dashboard.
 */
export interface SystemHealthData {
  /** Overall system status */
  overallStatus: HealthStatus;

  /** Individual service statuses */
  services: ServerStatus[];

  /** Health metrics */
  metrics: HealthMetrics;

  /** Last update timestamp */
  lastUpdated: Date;
}
