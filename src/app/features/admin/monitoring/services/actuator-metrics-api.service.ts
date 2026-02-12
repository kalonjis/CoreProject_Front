// src/app/features/admin/monitoring/services/actuator-metrics-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ExecutorMetrics, HealthMetrics } from '../models';

/**
 * API service for Spring Boot Actuator metrics endpoints.
 *
 * Provides access to JVM and system metrics including:
 * - JVM heap memory usage
 * - CPU usage (system and process)
 * - Disk space
 * - Database connection pool (HikariCP)
 * - Async executor thread pools
 * - Application uptime
 *
 * Used by the Health Metrics card in System Health dashboard.
 */
@Injectable({
  providedIn: 'root'
})
export class ActuatorMetricsApiService {

  private readonly http = inject(HttpClient);

  /** Base URL for monitoring endpoints */
  private readonly monitoringUrl = `/api/monitoring`;

  // ===========================================================================
  // API CALLS
  // ===========================================================================

  /**
   * Retrieves all health metrics for the dashboard.
   * Uses the aggregated dashboard endpoint.
   *
   * GET /api/monitoring/metrics/dashboard
   *
   * @returns Observable with HealthMetrics
   */
  getHealthMetrics(): Observable<HealthMetrics> {
    return this.http.get<DashboardMetricsResponse>(`${this.monitoringUrl}/metrics/dashboard`).pipe(
      map(response => this.mapToHealthMetrics(response)),
      catchError(err => {
        console.error('Failed to fetch dashboard metrics:', err);
        return of(this.getEmptyMetrics());
      })
    );
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Maps DashboardMetricsResponse from backend to HealthMetrics.
   * The structures are nearly identical, so minimal transformation needed.
   */
  private mapToHealthMetrics(response: DashboardMetricsResponse): HealthMetrics {
    return {
      jvm: {
        heapUsed: response.jvm.heapUsed,
        heapMax: response.jvm.heapMax,
        heapUsedPercent: response.jvm.heapUsedPercent
      },
      cpu: {
        systemUsage: response.cpu.systemUsage,
        processUsage: response.cpu.processUsage
      },
      disk: {
        free: response.disk.free,
        total: response.disk.total,
        freePercent: response.disk.freePercent
      },
      dbPool: {
        active: response.dbPool.active,
        idle: response.dbPool.idle,
        max: response.dbPool.max
      },
      executors: response.executors ?? [],
      uptime: response.uptime
    };
  }

  /**
   * Returns empty metrics as fallback on error.
   */
  private getEmptyMetrics(): HealthMetrics {
    return {
      jvm: { heapUsed: 0, heapMax: 1, heapUsedPercent: 0 },
      cpu: { systemUsage: 0, processUsage: 0 },
      disk: { free: 0, total: 1, freePercent: 0 },
      dbPool: { active: 0, idle: 0, max: 0 },
      executors: [],
      uptime: 0
    };
  }
}

// ===========================================================================
// BACKEND RESPONSE INTERFACES
// ===========================================================================

/**
 * Response from GET /api/monitoring/metrics/dashboard
 * Matches DashboardMetricsResponse.java
 */
interface DashboardMetricsResponse {
  jvm: {
    heapUsed: number;
    heapMax: number;
    heapUsedPercent: number;
  };
  cpu: {
    systemUsage: number;
    processUsage: number;
  };
  disk: {
    free: number;
    total: number;
    freePercent: number;
  };
  dbPool: {
    active: number;
    idle: number;
    max: number;
  };
  executors: ExecutorMetrics[];
  uptime: number;
}
