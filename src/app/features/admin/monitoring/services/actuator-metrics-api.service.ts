// src/app/features/admin/system-health/services/actuator-metrics-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import {HealthMetrics} from '../models';

/**
 * API service for Spring Boot Actuator metrics endpoints.
 *
 * Provides access to JVM and system metrics including:
 * - JVM heap memory usage
 * - CPU usage (system and process)
 * - Disk space
 * - Database connection pool (HikariCP)
 * - Application uptime
 *
 * Used by the Health Metrics card in System Health dashboard.
 */
@Injectable({
  providedIn: 'root'
})
export class ActuatorMetricsApiService {

  private readonly http = inject(HttpClient);

  /** Base URL for actuator endpoints */
  private readonly actuatorUrl = `/actuator`;

  // ===========================================================================
  // API CALLS
  // ===========================================================================

  /**
   * Retrieves a specific metric value from actuator.
   * GET /actuator/metrics/{metricName}
   *
   * @param metricName Name of the metric (e.g., 'jvm.memory.used')
   * @returns Observable with metric data
   */
  getMetric(metricName: string): Observable<MetricResponse> {
    return this.http.get<MetricResponse>(`${this.actuatorUrl}/metrics/${metricName}`);
  }

  /**
   * Retrieves all health metrics for the dashboard.
   * Combines multiple metric calls into a single HealthMetrics object.
   *
   * @returns Observable with aggregated health metrics
   */
  getHealthMetrics(): Observable<HealthMetrics> {
    return forkJoin({
      heapUsed: this.getMetricValue('jvm.memory.used', 'heap'),
      heapMax: this.getMetricValue('jvm.memory.max', 'heap'),
      cpuSystem: this.getMetricValue('system.cpu.usage'),
      cpuProcess: this.getMetricValue('process.cpu.usage'),
      diskFree: this.getMetricValue('disk.free'),
      diskTotal: this.getMetricValue('disk.total'),
      dbActive: this.getMetricValue('hikaricp.connections.active'),
      dbIdle: this.getMetricValue('hikaricp.connections.idle'),
      dbMax: this.getMetricValue('hikaricp.connections.max'),
      uptime: this.getMetricValue('process.uptime')
    }).pipe(
      map(metrics => this.buildHealthMetrics(metrics))
    );
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Retrieves a single metric value, optionally filtered by tag.
   *
   * @param metricName Metric name
   * @param areaTag Optional area tag filter (e.g., 'heap' for memory)
   * @returns Observable with the metric value or 0 on error
   */
  private getMetricValue(metricName: string, areaTag?: string): Observable<number> {
    let url = `${this.actuatorUrl}/metrics/${metricName}`;
    if (areaTag) {
      url += `?tag=area:${areaTag}`;
    }

    return this.http.get<MetricResponse>(url).pipe(
      map(response => response.measurements?.[0]?.value ?? 0),
      catchError(() => of(0))
    );
  }

  /**
   * Builds a HealthMetrics object from raw metric values.
   *
   * @param metrics Raw metric values from forkJoin
   * @returns Formatted HealthMetrics object
   */
  private buildHealthMetrics(metrics: Record<string, number>): HealthMetrics {
    const heapUsed = metrics['heapUsed'] || 0;
    const heapMax = metrics['heapMax'] || 1;
    const diskFree = metrics['diskFree'] || 0;
    const diskTotal = metrics['diskTotal'] || 1;

    return {
      jvm: {
        heapUsed,
        heapMax,
        heapUsedPercent: Math.round((heapUsed / heapMax) * 100)
      },
      cpu: {
        systemUsage: Math.round((metrics['cpuSystem'] || 0) * 100),
        processUsage: Math.round((metrics['cpuProcess'] || 0) * 100)
      },
      disk: {
        free: diskFree,
        total: diskTotal,
        freePercent: Math.round((diskFree / diskTotal) * 100)
      },
      dbPool: {
        active: metrics['dbActive'] || 0,
        idle: metrics['dbIdle'] || 0,
        max: metrics['dbMax'] || 0
      },
      uptime: metrics['uptime'] || 0
    };
  }
}

// ===========================================================================
// SUPPORTING INTERFACES
// ===========================================================================

/**
 * Raw metric response from Spring Boot Actuator.
 */
interface MetricResponse {
  name: string;
  description?: string;
  baseUnit?: string;
  measurements: Array<{
    statistic: string;
    value: number;
  }>;
  availableTags?: Array<{
    tag: string;
    values: string[];
  }>;
}
