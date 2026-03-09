// src/app/features/sport/pages/sport-dashboard/sport-dashboard.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TrackListComponent } from '../../components/track-list/track-list.component';
import { StatsSummaryComponent } from '../../components/stats-summary/stats-summary.component';
import { TrackImportDialogComponent } from '../../components/track-import-dialog/track-import-dialog.component';
import { SportTrackService } from '../../services/sport-track.service';
import { SportTrack } from '../../models/sport-track.model';
import { OwnerStats } from '../../models/owner-stats.model';

/**
 * Main dashboard page for sport tracking.
 *
 * Displays:
 * - Aggregated statistics
 * - List of sport tracks with filters
 * - Import button for adding new tracks
 *
 * Route: /sport
 */
@Component({
    selector: 'app-sport-dashboard',
    imports: [
        CommonModule,
        TrackListComponent,
        StatsSummaryComponent,
        TrackImportDialogComponent
    ],
    templateUrl: './sport-dashboard.component.html',
    styleUrl: './sport-dashboard.component.scss'
})
export class SportDashboardComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly sportTrackService = inject(SportTrackService);
  private readonly destroyRef = inject(DestroyRef);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Owner statistics */
  stats = signal<OwnerStats | null>(null);

  /** Stats loading state */
  statsLoading = signal(true);

  /** Import dialog visibility */
  showImportDialog = signal(false);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.loadStats();

    // Subscribe to stats updates
    this.sportTrackService.stats$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(stats => {
        this.stats.set(stats);
        if (stats) {
          this.statsLoading.set(false);
        }
      });
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Loads owner statistics.
   */
  private loadStats(): void {
    this.statsLoading.set(true);

    this.sportTrackService.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.statsLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load stats:', err);
          this.statsLoading.set(false);
        }
      });
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Opens the import dialog.
   */
  openImportDialog(): void {
    this.showImportDialog.set(true);
  }

  /**
   * Closes the import dialog.
   */
  closeImportDialog(): void {
    this.showImportDialog.set(false);
  }

  /**
   * Handles successful track import.
   */
  onTrackImported(track: SportTrack): void {
    // Refresh stats
    this.loadStats();

    // Navigate to the new track detail
    this.router.navigate(['/sport', track.publicId]);
  }

  /**
   * Navigates to track detail view.
   */
  viewTrack(publicId: string): void {
    this.router.navigate(['/sport', publicId]);
  }
}
