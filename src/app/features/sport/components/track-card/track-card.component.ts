// src/app/features/sport/components/track-card/track-card.component.ts

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SportTrackSummary } from '../../models/sport-track.model';
import { getSportTypeInfo } from '../../models/sport-type.model';
import {
  formatDistance,
  formatSpeed,
  formatElevation,
  formatTrackDateShort,
  formatTrackTime
} from '../../models/utils/sport-track.utils';

/**
 * Card component displaying a sport track summary.
 *
 * Used in list views to show key metrics at a glance.
 * Clicking the card navigates to the track detail view.
 *
 * @example
 * ```html
 * <app-track-card
 *   [track]="track"
 *   (onClick)="viewTrack($event)" />
 * ```
 */
@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-card.component.html',
  styleUrl: './track-card.component.scss'
})
export class TrackCardComponent {

  // ===========================================================================
  // INPUTS / OUTPUTS
  // ===========================================================================

  /** Track data to display */
  track = input.required<SportTrackSummary>();

  /** Emitted when card is clicked */
  onClick = output<string>();

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Sport type display info */
  get sportTypeInfo() {
    return getSportTypeInfo(this.track().sportType);
  }

  /** Formatted date */
  get date(): string {
    return formatTrackDateShort(this.track().startedAt);
  }

  /** Formatted time */
  get time(): string {
    return formatTrackTime(this.track().startedAt);
  }

  /** Formatted distance */
  get distance(): string {
    return formatDistance(this.track().distanceKm);
  }

  /** Formatted duration */
  get duration(): string {
    return this.track().durationFormatted;
  }

  /** Formatted speed (km/h or pace) */
  get speed(): string {
    return formatSpeed(this.track().avgSpeedKmh, this.sportTypeInfo.isCycling);
  }

  /** Formatted elevation gain */
  get elevation(): string {
    return formatElevation(this.track().elevationGain);
  }

  /** Speed label based on sport type */
  get speedLabel(): string {
    return this.sportTypeInfo.isCycling ? 'Vitesse moy.' : 'Allure moy.';
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /** Handles card click */
  handleClick(): void {
    this.onClick.emit(this.track().publicId);
  }

  /** Handles keyboard navigation */
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick();
    }
  }
}
