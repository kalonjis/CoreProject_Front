// src/app/features/admin/monitoring/components/executor-metrics-card/executor-metrics-card.component.ts

import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExecutorMetrics, EXECUTOR_DISPLAY_CONFIG } from '../../models';

/**
 * Executor Metrics Card component.
 *
 * Displays async thread pool executor metrics with visual indicators:
 * - Queue usage with progress bars
 * - Active threads vs pool size
 * - Saturation warnings
 * - Completed task counts
 *
 * Color thresholds (based on queue usage):
 * - Green: < 70%
 * - Orange: 70-90%
 * - Red: > 90% or saturated
 *
 * Why monitor executors?
 * Circuit breakers protect against external service failures, but executor
 * saturation causes task rejection BEFORE the external call is made.
 * This creates silent failures invisible to circuit breakers.
 */
@Component({
  selector: 'app-executor-metrics-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './executor-metrics-card.component.html',
  styleUrl: './executor-metrics-card.component.scss'
})
export class ExecutorMetricsCardComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** Executor metrics array */
  @Input() set executors(value: ExecutorMetrics[] | null) {
    this._executors.set(value ?? []);
  }

  /** Loading state from parent */
  @Input() isLoading = false;

  // ===========================================================================
  // STATE
  // ===========================================================================

  private readonly _executors = signal<ExecutorMetrics[]>([]);

  /** Exposed executors for template */
  readonly executors$ = computed(() => this._executors());

  /** True if executors are available */
  readonly hasExecutors = computed(() => this._executors().length > 0);

  /** Count of saturated executors */
  readonly saturatedCount = computed(() =>
    this._executors().filter(e => e.saturated).length
  );

  /** True if any executor is saturated */
  readonly hasAnySaturated = computed(() => this.saturatedCount() > 0);

  // ===========================================================================
  // DISPLAY HELPERS
  // ===========================================================================

  /**
   * Gets display configuration for an executor.
   *
   * @param name Executor name
   * @returns Display config with label, icon, description
   */
  getDisplayConfig(name: string) {
    return EXECUTOR_DISPLAY_CONFIG[name] ?? {
      label: this.formatExecutorName(name),
      icon: '⚙️',
      description: 'Async executor'
    };
  }

  /**
   * Formats executor name to a readable label.
   * e.g., "activityLog" -> "Activity Log"
   *
   * @param name Raw executor name
   * @returns Formatted label
   */
  private formatExecutorName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // ===========================================================================
  // STYLE HELPERS
  // ===========================================================================

  /**
   * Gets CSS class for queue usage based on percentage.
   *
   * @param percent Queue usage percentage
   * @param saturated Whether executor is saturated
   * @returns CSS class name
   */
  getQueueUsageClass(percent: number, saturated: boolean): string {
    if (saturated || percent > 90) {
      return 'usage-critical';
    }
    if (percent > 70) {
      return 'usage-warning';
    }
    return 'usage-healthy';
  }

  /**
   * Gets CSS class for thread usage.
   *
   * @param active Active thread count
   * @param max Maximum pool size
   * @returns CSS class name
   */
  getThreadUsageClass(active: number, max: number): string {
    if (max === 0) return 'usage-healthy';
    const percent = (active / max) * 100;
    if (percent >= 100) return 'usage-critical';
    if (percent >= 80) return 'usage-warning';
    return 'usage-healthy';
  }

  /**
   * Calculates thread usage percentage for progress bar.
   *
   * @param active Active thread count
   * @param max Maximum pool size
   * @returns Percentage (0-100)
   */
  getThreadUsagePercent(active: number, max: number): number {
    if (max === 0) return 0;
    return Math.min(100, Math.round((active / max) * 100));
  }

  // ===========================================================================
  // FORMATTING HELPERS
  // ===========================================================================

  /**
   * Formats a number with thousand separators.
   *
   * @param value Number to format
   * @returns Formatted string
   */
  formatNumber(value: number): string {
    return value.toLocaleString();
  }

  /**
   * Formats queue capacity, handling unbounded queues.
   *
   * @param capacity Queue capacity (-1 if unbounded)
   * @returns Formatted string
   */
  formatCapacity(capacity: number): string {
    return capacity < 0 ? '∞' : capacity.toString();
  }
}
