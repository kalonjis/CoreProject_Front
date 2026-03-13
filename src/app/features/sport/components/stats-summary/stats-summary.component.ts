// src/app/features/sport/components/stats-summary/stats-summary.component.ts

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OwnerStats } from '../../models/owner-stats.model';

/**
 * Component displaying aggregated sport statistics.
 *
 * Shows total distance, duration, elevation gain, and track count.
 *
 * @example
 * ```html
 * <app-stats-summary [stats]="stats()" />
 * ```
 */
@Component({
    selector: 'app-stats-summary',
    imports: [CommonModule],
    templateUrl: './stats-summary.component.html',
    styleUrl: './stats-summary.component.scss'
})
export class StatsSummaryComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** Statistics data */
  stats = input.required<OwnerStats | null>();

  /** Show loading skeleton */
  loading = input<boolean>(false);

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Formatted distance */
  get distance(): string {
    const s = this.stats();
    if (!s) return '-';
    return `${s.totalDistanceKm.toFixed(0)} km`;
  }

  /** Formatted duration */
  get duration(): string {
    const s = this.stats();
    if (!s) return '-';
    return s.totalDurationFormatted;
  }

  /** Formatted elevation */
  get elevation(): string {
    const s = this.stats();
    if (!s) return '-';
    return `${s.totalElevationGainM.toFixed(0)} m`;
  }

  /** Track count */
  get trackCount(): number {
    return this.stats()?.totalTracks ?? 0;
  }
}
