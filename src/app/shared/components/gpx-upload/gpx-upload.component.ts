// src/app/shared/components/gpx-upload/gpx-upload.component.ts

import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FileCategory, FileUploadResponse, StorageApiService} from '../../../core/storage';
import {FeedbackService} from '../../feedback/tools/feedback.service';


/**
 * GPX file upload component.
 *
 * Provides a simple interface for users to upload GPX track files.
 * Handles file selection, client-side validation, upload, and feedback.
 *
 * Features:
 * - Drag & drop support
 * - Client-side validation (extension, size)
 * - Upload progress indication
 * - Success/error feedback
 *
 * @example
 * ```html
 * <app-gpx-upload
 *   [maxSizeMb]="20"
 *   (uploaded)="onGpxUploaded($event)"
 *   (error)="onUploadError($event)" />
 * ```
 */
@Component({
  selector: 'app-gpx-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gpx-upload.component.html',
  styleUrl: './gpx-upload.component.scss'
})
export class GpxUploadComponent {

  private readonly storageApi = inject(StorageApiService);
  private readonly feedbackService = inject(FeedbackService);

  // ===========================================================================
  // INPUTS / OUTPUTS
  // ===========================================================================

  /** Maximum file size in MB (default: 20MB) */
  maxSizeMb = input<number>(20);

  /** Optional description to attach to the file */
  description = input<string | undefined>(undefined);

  /** Emitted when upload succeeds */
  uploaded = output<FileUploadResponse>();

  /** Emitted when upload fails */
  error = output<string>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Upload in progress */
  isUploading = signal(false);

  /** Drag over state for visual feedback */
  isDragOver = signal(false);

  /** Selected file name for display */
  selectedFileName = signal<string | null>(null);

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /** Allowed file extension */
  private readonly allowedExtension = '.gpx';

  /** Allowed MIME types */
  private readonly allowedTypes = [
    'application/gpx+xml',
    'application/xml',
    'text/xml'
  ];

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Triggers the hidden file input.
   */
  openFileExplorer(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  /**
   * Handles file selection from input.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.processFile(file);
    }

    // Reset input to allow selecting the same file again
    input.value = '';
  }

  /**
   * Handles drag over event.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  /**
   * Handles drag leave event.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  /**
   * Handles file drop.
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Validates and uploads the file.
   */
  private processFile(file: File): void {
    // Client-side validation
    const validationError = this.validateFile(file);
    if (validationError) {
      this.feedbackService.showError(validationError);
      this.error.emit(validationError);
      return;
    }

    this.uploadFile(file);
  }

  /**
   * Client-side file validation.
   *
   * @returns Error message if invalid, null if valid
   */
  private validateFile(file: File): string | null {
    // Check extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(this.allowedExtension)) {
      return 'Please select a GPX file (.gpx)';
    }

    // Check MIME type (browsers may report differently)
    // Some browsers report 'application/octet-stream' for .gpx files
    // so we primarily rely on extension check above

    // Check size
    const maxSizeBytes = this.maxSizeMb() * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${this.maxSizeMb()} MB`;
    }

    return null;
  }

  /**
   * Uploads the file to the server.
   */
  private uploadFile(file: File): void {
    this.isUploading.set(true);
    this.selectedFileName.set(file.name);

    this.storageApi.upload(file, FileCategory.GPX_TRACK, this.description()).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.feedbackService.showSuccess('GPX file uploaded successfully');
        this.uploaded.emit(response);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.selectedFileName.set(null);

        const errorMessage = err.error?.message || 'Failed to upload GPX file';
        this.feedbackService.showError(errorMessage);
        this.error.emit(errorMessage);
      }
    });
  }
}
