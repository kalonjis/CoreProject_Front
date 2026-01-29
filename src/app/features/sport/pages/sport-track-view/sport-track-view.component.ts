// src/app/features/sport/pages/sport-track-view/sport-track-view.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { TrackDetailComponent } from '../../components/track-detail/track-detail.component';
import { TrackMapComponent } from '../../components/track-map/track-map.component';
import { ElevationChartComponent } from '../../components/elevation-chart/elevation-chart.component';
import { SportTrackService } from '../../services/sport-track.service';
import { SportTrack } from '../../models/sport-track.model';
import { ConfirmDialogService } from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { FeedbackService } from '../../../../shared/feedback/tools/feedback.service';

/**
 * Page displaying full sport track details.
 *
 * Shows:
 * - Interactive map with track trace
 * - Elevation profile chart
 * - Detailed metrics
 * - Edit/Delete actions
 *
 * Route: /sport/:publicId
 */
@Component({
  selector: 'app-sport-track-view',
  standalone: true,
  imports: [
    CommonModule,
    TrackDetailComponent,
    TrackMapComponent,
    ElevationChartComponent
  ],
  templateUrl: './sport-track-view.component.html',
  styleUrl: './sport-track-view.component.scss'
})
export class SportTrackViewComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sportTrackService = inject(SportTrackService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Track data */
  track = signal<SportTrack | null>(null);

  /** Loading state */
  isLoading = signal(true);

  /** Error message */
  error = signal<string | null>(null);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const publicId = params.get('publicId');
        if (!publicId) {
          throw new Error('No publicId provided');
        }
        this.isLoading.set(true);
        return this.sportTrackService.getByPublicId(publicId);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (track) => {
        this.track.set(track);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load track:', err);
        this.error.set('Impossible de charger l\'activité');
        this.isLoading.set(false);
      }
    });
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Navigates back to dashboard.
   */
  goBack(): void {
    this.router.navigate(['/sport']);
  }

  /**
   * Opens edit modal (TODO: implement).
   */
  openEdit(): void {
    // TODO: Implement edit modal
    this.feedbackService.showInfo('Fonctionnalité à venir');
  }

  /**
   * Confirms and deletes the track.
   */
  async confirmDelete(): Promise<void> {
    const track = this.track();
    if (!track) return;

    try {
      await this.confirmDialog.confirm({
        title: 'Supprimer l\'activité',
        message: `Voulez-vous vraiment supprimer "${track.name}" ? Cette action est irréversible.`,
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        type: 'danger'
      });

      // User confirmed
      this.sportTrackService.delete(track.publicId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.feedbackService.showSuccess('Activité supprimée');
            this.router.navigate(['/sport']);
          },
          error: (err) => {
            console.error('Failed to delete track:', err);
            this.feedbackService.showError('Erreur lors de la suppression');
          }
        });
    } catch {
      // User cancelled - do nothing
    }
  }
}
