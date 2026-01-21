// src/app/features/admin/system-health/components/health-metrics-card/health-metrics-card.component.ts

import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HealthMetrics} from '../../models';

/**
 * Health Metrics Card component.
 *
 * Displays system resource metrics with visual progress bars:
 * - JVM Heap Memory usage
 * - CPU usage (system and process)
 * - Disk space
 * - Database connection pool (HikariCP)
 * - Application uptime
 *
 * Color thresholds:
 * - Green: < 70%
 * - Orange: 70-90%
 * - Red: > 90%
 *
 * Used in the System Health dashboard.
 */
@Component({
  selector: 'app-health-metrics-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './health-metrics-card.component.html',
  styleUrl: './health-metrics-card.component.scss'
})
export class HealthMetricsCardComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** Health metrics data */
  @Input() set metrics(value: HealthMetrics | null) {
    this._metrics.set(value);
  }

  /** Loading state from parent */
  @Input() isLoading = false;

  // ===========================================================================
  // STATE
  // ===========================================================================

  private readonly _metrics = signal<HealthMetrics | null>(null);

  /** Exposed metrics for template */
  readonly metrics$ = computed(() => this._metrics());

  /** True if metrics are available */
  readonly hasMetrics = computed(() => this._metrics() !== null);

  // ===========================================================================
  // FORMATTING HELPERS
  // ===========================================================================

  /**
   * Formats bytes to a human-readable string.
   *
   * @param bytes Number of bytes
   * @returns Formatted string (e.g., "1.5 GB")
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
  }

  /**
   * Formats uptime seconds to a human-readable string.
   *
   * @param seconds Total seconds
   * @returns Formatted string (e.g., "2d 5h 30m")
   */
  formatUptime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.floor(seconds)}s`;
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '0m';
  }

  /**
   * Formats a percentage value.
   *
   * @param value Percentage (0-100)
   * @returns Formatted string (e.g., "75%")
   */
  formatPercent(value: number): string {
    return `${Math.round(value)}%`;
  }

  // ===========================================================================
  // THRESHOLD HELPERS
  // ===========================================================================

  /**
   * Returns the CSS class based on usage percentage.
   * Used for progress bar coloring.
   *
   * @param percent Usage percentage (0-100)
   * @param inverted If true, lower is worse (e.g., free disk space)
   * @returns CSS class name
   */
  getUsageClass(percent: number, inverted = false): string {
    const effectivePercent = inverted ? 100 - percent : percent;

    if (effectivePercent >= 90) return 'usage-critical';
    if (effectivePercent >= 70) return 'usage-warning';
    return 'usage-healthy';
  }

  /**
   * Returns the CSS class for DB pool usage.
   * Considers active connections vs max.
   *
   * @param active Active connections
   * @param max Maximum connections
   * @returns CSS class name
   */
  getPoolUsageClass(active: number, max: number): string {
    if (max === 0) return 'usage-healthy';
    const percent = (active / max) * 100;
    return this.getUsageClass(percent);
  }

  /**
   * Calculates the percentage of active DB connections.
   *
   * @param active Active connections
   * @param max Maximum connections
   * @returns Percentage (0-100)
   */
  getPoolUsagePercent(active: number, max: number): number {
    if (max === 0) return 0;
    return Math.round((active / max) * 100);
  }
}
