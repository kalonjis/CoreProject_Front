// src/app/features/sport/components/track-list/track-list.component.ts

import { Component, inject, input, output, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TrackCardComponent } from '../track-card/track-card.component';
import { SportTrackService } from '../../services/sport-track.service';
import { SportTrackSummary } from '../../models/sport-track.model';
import { SportType, SPORT_TYPES } from '../../models/sport-type.model';
import { Page } from '../../../../shared/models/page.model';

/**
 * List component displaying sport tracks with filtering and pagination.
 *
 * Features:
 * - Filter by sport type
 * - Infinite scroll or pagination
 * - Empty state handling
 * - Loading states
 *
 * @example
 * ```html
 * <app-track-list
 *   (onTrackSelect)="viewTrack($event)" />
 * ```
 */
@Component({
    selector: 'app-track-list',
    imports: [CommonModule, TrackCardComponent],
    templateUrl: './track-list.component.html',
    styleUrl: './track-list.component.scss'
})
export class TrackListComponent implements OnInit {

  private readonly sportTrackService = inject(SportTrackService);
  private readonly destroyRef = inject(DestroyRef);

  // ===========================================================================
  // INPUTS / OUTPUTS
  // ===========================================================================

  /** Initial sport type filter */
  initialFilter = input<SportType | null>(null);

  /** Emitted when a track is selected */
  onTrackSelect = output<string>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Current filter */
  currentFilter = signal<SportType | null>(null);

  /** Tracks from service */
  tracks = signal<SportTrackSummary[]>([]);

  /** Loading state */
  isLoading = signal(true);

  /** Has more pages */
  hasMore = signal(false);

  /** Current page */
  currentPage = signal(0);

  /** Available filters */
  readonly sportTypes = SPORT_TYPES;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.currentFilter.set(this.initialFilter());
    this.loadTracks();

    // Subscribe to service tracks
    this.sportTrackService.tracks$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tracks => this.tracks.set(tracks));

    this.sportTrackService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => this.isLoading.set(loading));
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Loads tracks from the service.
   */
  loadTracks(page = 0): void {
    const filter = this.currentFilter() ?? undefined;

    this.sportTrackService.list(page, 20, filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: Page<SportTrackSummary>) => {
          this.currentPage.set(response.number);
          this.hasMore.set(!response.last);
        },
        error: (err) => {
          console.error('Failed to load tracks:', err);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Loads more tracks (next page).
   */
  loadMore(): void {
    if (this.hasMore() && !this.isLoading()) {
      this.loadTracks(this.currentPage() + 1);
    }
  }

  /**
   * Applies a sport type filter.
   */
  applyFilter(sportType: SportType | null): void {
    if (this.currentFilter() === sportType) return;

    this.currentFilter.set(sportType);
    this.sportTrackService.clearCache();
    this.loadTracks(0);
  }

  /**
   * Handles track card click.
   */
  selectTrack(publicId: string): void {
    this.onTrackSelect.emit(publicId);
  }

  /**
   * Refreshes the list.
   */
  refresh(): void {
    this.sportTrackService.clearCache();
    this.loadTracks(0);
  }
}
