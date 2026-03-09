// src/app/features/admin/system-health/components/server-status-card/server-status-card.component.ts

import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HealthStatus, ServerStatus} from '../../models';

/**
 * Server Status Card component.
 *
 * Displays the health status of all monitored services in a grid layout.
 * Each service shows:
 * - Icon and name
 * - Status indicator (colored dot)
 * - Optional status message
 * - Last check timestamp
 *
 * Status colors:
 * - UP: Green
 * - DOWN: Red
 * - DEGRADED/WARNING: Orange
 * - RECOVERING/HALF_OPEN: Yellow
 * - UNKNOWN: Gray
 *
 * Used in the System Health dashboard.
 */
@Component({
    selector: 'app-server-status-card',
    imports: [CommonModule],
    templateUrl: './server-status-card.component.html',
    styleUrl: './server-status-card.component.scss'
})
export class ServerStatusCardComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** List of server/service statuses to display */
  @Input({ required: true }) set statuses(value: ServerStatus[]) {
    this._statuses.set(value);
  }

  /** Loading state from parent */
  @Input() isLoading = false;

  // ===========================================================================
  // STATE
  // ===========================================================================

  private readonly _statuses = signal<ServerStatus[]>([]);

  /** Exposed statuses for template */
  readonly statuses$ = computed(() => this._statuses());

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Count of healthy services (UP status) */
  readonly healthyCount = computed(() =>
    this._statuses().filter(s => s.status === 'UP').length
  );

  /** Total number of services */
  readonly totalCount = computed(() => this._statuses().length);

  /** True if all services are healthy */
  readonly allHealthy = computed(() =>
    this.healthyCount() === this.totalCount() && this.totalCount() > 0
  );

  /** True if any service is down */
  readonly hasDownService = computed(() =>
    this._statuses().some(s => s.status === 'DOWN')
  );

  // ===========================================================================
  // METHODS
  // ===========================================================================

  /**
   * Returns the CSS class for a given health status.
   *
   * @param status Health status
   * @returns CSS class name
   */
  getStatusClass(status: HealthStatus): string {
    switch (status) {
      case 'UP':
        return 'status-up';
      case 'DOWN':
        return 'status-down';
      case 'DEGRADED':
      case 'WARNING':
        return 'status-warning';
      case 'RECOVERING':
        return 'status-recovering';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Returns a human-readable label for a health status.
   *
   * @param status Health status
   * @returns Display label
   */
  getStatusLabel(status: HealthStatus): string {
    switch (status) {
      case 'UP':
        return 'Online';
      case 'DOWN':
        return 'Offline';
      case 'DEGRADED':
        return 'Degraded';
      case 'WARNING':
        return 'Warning';
      case 'RECOVERING':
        return 'Recovering';
      default:
        return 'Unknown';
    }
  }

  /**
   * Tracks server status items by their unique ID.
   *
   * @param index Item index
   * @param item Server status
   * @returns Unique identifier
   */
  trackByStatus(index: number, item: ServerStatus): string {
    return item.id;
  }
}
