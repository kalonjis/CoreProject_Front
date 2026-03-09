// src/app/features/sport/components/track-import-dialog/track-import-dialog.component.ts

import { Component, inject, input, output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GpxUploadComponent } from '../gpx-upload/gpx-upload.component';
import { SportTrackService } from '../../services/sport-track.service';
import { SportType, SPORT_TYPES, SportTypeInfo } from '../../models/sport-type.model';
import { SportTrack } from '../../models/sport-track.model';
import { FileUploadResponse } from '../../../../core/storage';
import { FeedbackService } from '../../../../shared/feedback/tools/feedback.service';

/**
 * Dialog for importing GPX files as sport tracks.
 *
 * Two-step flow:
 * 1. Upload GPX file (uses GpxUploadComponent)
 * 2. Configure track (name, sport type) and import
 *
 * @example
 * ```html
 * <app-track-import-dialog
 *   [isOpen]="showImportDialog()"
 *   (onClose)="showImportDialog.set(false)"
 *   (onImported)="onTrackImported($event)" />
 * ```
 */
@Component({
    selector: 'app-track-import-dialog',
    imports: [CommonModule, FormsModule, GpxUploadComponent],
    templateUrl: './track-import-dialog.component.html',
    styleUrl: './track-import-dialog.component.scss'
})
export class TrackImportDialogComponent implements OnChanges {

  private readonly sportTrackService = inject(SportTrackService);
  private readonly feedbackService = inject(FeedbackService);

  // ===========================================================================
  // INPUTS / OUTPUTS
  // ===========================================================================

  /** Controls dialog visibility */
  isOpen = input<boolean>(false);

  /** Emitted when dialog is closed */
  onClose = output<void>();

  /** Emitted when track is successfully imported */
  onImported = output<SportTrack>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Dialog visibility (for animations) */
  isVisible = signal(false);

  /** Uploaded file info */
  uploadedFile = signal<FileUploadResponse | null>(null);

  /** Track name (editable) */
  trackName = signal('');

  /** Is name being edited */
  isEditingName = signal(false);

  /** Selected sport type */
  sportType = signal<SportType>('MTB');

  /** Import in progress */
  isImporting = signal(false);

  /** Available sport types for select */
  readonly sportTypes: SportTypeInfo[] = SPORT_TYPES;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen()) {
        this.openDialog();
      } else {
        this.closeDialog();
      }
    }
  }

  // ===========================================================================
  // DIALOG CONTROL
  // ===========================================================================

  private openDialog(): void {
    this.resetState();
    this.isVisible.set(true);
    document.body.style.overflow = 'hidden';
  }

  private closeDialog(): void {
    this.isVisible.set(false);
    document.body.style.overflow = '';
  }

  private resetState(): void {
    this.uploadedFile.set(null);
    this.trackName.set('');
    this.sportType.set('MTB');
    this.isEditingName.set(false);
    this.isImporting.set(false);
  }

  // ===========================================================================
  // UPLOAD HANDLING
  // ===========================================================================

  /**
   * Called when GPX file is uploaded successfully.
   */
  onFileUploaded(response: FileUploadResponse): void {
    this.uploadedFile.set(response);

    // Pre-fill name from filename (remove .gpx extension)
    const name = response.originalFilename?.replace(/\.gpx$/i, '') ?? 'Nouvelle activité';
    this.trackName.set(name);
  }

  /**
   * Called when upload fails.
   */
  onUploadError(error: string): void {
    // Error is already shown by GpxUploadComponent via FeedbackService
    console.error('GPX upload error:', error);
  }

  // ===========================================================================
  // NAME EDITING
  // ===========================================================================

  /**
   * Starts editing the track name.
   */
  startEditingName(): void {
    this.isEditingName.set(true);
  }

  /**
   * Stops editing the track name.
   */
  stopEditingName(): void {
    this.isEditingName.set(false);
  }

  /**
   * Handles Enter key in name input.
   */
  onNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.stopEditingName();
    }
  }

  // ===========================================================================
  // IMPORT
  // ===========================================================================

  /**
   * Imports the GPX file as a sport track.
   */
  importTrack(): void {
    const file = this.uploadedFile();
    if (!file) return;

    this.isImporting.set(true);

    this.sportTrackService.import(file.publicId, this.sportType()).subscribe({
      next: (track) => {
        this.isImporting.set(false);
        this.feedbackService.showSuccess('Activité importée avec succès !');
        this.onImported.emit(track);
        this.onClose.emit();
      },
      error: (err) => {
        this.isImporting.set(false);
        const message = err.error?.message ?? 'Erreur lors de l\'import';
        this.feedbackService.showError(message);
      }
    });
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Closes the dialog.
   */
  close(): void {
    this.onClose.emit();
  }

  /**
   * Handles backdrop click.
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.close();
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Checks if import button should be disabled.
   */
  get canImport(): boolean {
    return !!this.uploadedFile() && this.trackName().trim().length > 0 && !this.isImporting();
  }
}
