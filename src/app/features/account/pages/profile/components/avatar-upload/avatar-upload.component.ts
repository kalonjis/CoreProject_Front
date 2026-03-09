// src/app/features/account/pages/profile/components/avatar-upload/avatar-upload.component.ts

import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import {StorageApiService, FileCategory, FileUploadResponse, AvatarResponse} from '../../../../../../core/storage';
import {FeedbackService} from '../../../../../../shared/feedback/tools/feedback.service';

/**
 * Avatar upload component.
 *
 * Provides a simple interface for users to upload their profile picture.
 * Handles file selection, validation, upload, and feedback display.
 *
 * Features:
 * - Click to open file explorer
 * - Client-side validation (type, size)
 * - Upload progress indication
 * - Success/error feedback
 * - Preview of current avatar
 *
 * @example
 * ```html
 * <app-avatar-upload
 *   [currentAvatarUrl]="user.avatarUrl"
 *   (uploaded)="onAvatarUploaded($event)" />
 * ```
 */
@Component({
    selector: 'app-avatar-upload',
    imports: [CommonModule],
    templateUrl: './avatar-upload.component.html',
    styleUrl: './avatar-upload.component.scss'
})
export class AvatarUploadComponent {

  private readonly storageApi: StorageApiService = inject(StorageApiService);
  private feedbackService: FeedbackService = inject(FeedbackService);

  // ===========================================================================
  // INPUTS / OUTPUTS
  // ===========================================================================

  /** Current avatar URL to display */
  currentAvatarUrl = input<string | null>(null);

  /** Emitted when upload succeeds */
  uploaded = output<AvatarResponse>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Upload in progress */
  isUploading = signal(false);

  /** Preview URL for selected file (before upload) */
  previewUrl = signal<string | null>(null);

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /** Allowed MIME types */
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  /** Max file size in bytes (2MB) */
  private readonly maxSize = 2 * 1024 * 1024;

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

    if (!file) return;

    // Reset input for re-selection of same file
    input.value = '';

    // Validate
    const error = this.validateFile(file);
    if (error) {
      this.feedbackService.showError(error);
      return;
    }

    // Show preview
    this.createPreview(file);

    // Upload
    this.uploadFile(file);
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Validates file type and size.
   * @returns Error message or null if valid
   */
  private validateFile(file: File): string | null {
    if (!this.allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please select a JPEG, PNG, or WebP image.';
    }

    if (file.size > this.maxSize) {
      return `File too large. Maximum size is ${this.maxSize / 1024 / 1024}MB.`;
    }

    return null;
  }

  /**
   * Creates a local preview URL for the selected file.
   */
  private createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Uploads the file to the server.
   */
  private uploadFile(file: File): void {
    this.isUploading.set(true);
    this.feedbackService.clearFeedback();

    this.storageApi.uploadAvatar(file).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.previewUrl.set(null);
        this.feedbackService.showSuccess('Avatar uploaded successfully!');
        this.uploaded.emit(response);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.previewUrl.set(null);
        this.feedbackService.showError(this.formatUploadError(err));
      }
    });
  }

  /**
   * Transforms technical backend errors into user-friendly messages.
   */
  private formatUploadError(err: any): string {
    const raw = err.error?.error || err.error?.message || '';

    if (raw.includes('width') || raw.includes('height') || raw.includes('dimension')) {
      return 'Image too large. Please use an image smaller than 1024x1024 pixels.';
    }

    if (raw.includes('File too large') || raw.includes('exceeds maximum allowed size')) {
      return 'File too large. Maximum size is 2MB.';
    }

    if (raw.includes('type') || raw.includes('MIME')) {
      return 'Invalid file type. Please use JPEG, PNG, or WebP.';
    }

    return raw || 'Upload failed. Please try again.';
  }
}
