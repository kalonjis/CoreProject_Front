// src/app/features/sport/components/track-detail/track-detail.component.ts

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SportTrack } from '../../models/sport-track.model';
import { getSportTypeInfo } from '../../models/sport-type.model';
import {
  formatDistance,
  formatSpeed,
  formatElevation,
  formatTrackDate,
  formatTrackTime,
  formatDuration
} from '../../models/utils/sport-track.utils';

/**
 * Component displaying detailed sport track information.
 *
 * Shows all metrics in a clean layout with edit/delete actions.
 *
 * @example
 * ```html
 * <app-track-detail
 *   [track]="track"
 *   (onEdit)="openEditModal()"
 *   (onDelete)="confirmDelete()" />
 * ```
 */
@Component({
    selector: 'app-track-detail',
    imports: [CommonModule],
    templateUrl: './track-detail.component.html',
    styleUrl: './track-detail.component.scss'
})
export class TrackDetailComponent {

  // ===========================================================================
  // INPUTS / OUTPUTS
  // ===========================================================================

  /** Track data */
  track = input.required<SportTrack>();

  /** Emitted when edit is requested */
  onEdit = output<void>();

  /** Emitted when delete is requested */
  onDelete = output<void>();

  // ===========================================================================
  // COMPUTED - METADATA
  // ===========================================================================

  get sportTypeInfo() {
    return getSportTypeInfo(this.track().sportType);
  }

  get date(): string {
    return formatTrackDate(this.track().startedAt);
  }

  get startTime(): string {
    return formatTrackTime(this.track().startedAt);
  }

  get endTime(): string {
    return formatTrackTime(this.track().endedAt);
  }

  // ===========================================================================
  // COMPUTED - MAIN METRICS
  // ===========================================================================

  get distance(): string {
    return formatDistance(this.track().distanceKm);
  }

  get duration(): string {
    return this.track().durationFormatted;
  }

  get avgSpeed(): string {
    return formatSpeed(this.track().avgSpeedKmh, this.sportTypeInfo.isCycling);
  }

  get maxSpeed(): string {
    const max = this.track().maxSpeedKmh;
    if (!max) return '-';
    return `${max.toFixed(1)} km/h`;
  }

  get speedLabel(): string {
    return this.sportTypeInfo.isCycling ? 'Vitesse moyenne' : 'Allure moyenne';
  }

  // ===========================================================================
  // COMPUTED - ELEVATION
  // ===========================================================================

  get elevationGain(): string {
    return formatElevation(this.track().elevationGain);
  }

  get elevationLoss(): string {
    return formatElevation(this.track().elevationLoss);
  }

  get elevationMin(): string {
    return formatElevation(this.track().elevationMin);
  }

  get elevationMax(): string {
    return formatElevation(this.track().elevationMax);
  }

  get hasElevation(): boolean {
    return this.track().elevationGain !== null;
  }
}
