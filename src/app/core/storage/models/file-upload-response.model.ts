// src/app/core/storage/models/file-upload-response.model.ts

import { FileCategory } from './file-category.enum';

/**
 * Response returned after a successful file upload.
 *
 * Maps to backend FileUploadResponse record.
 * Contains all metadata needed to reference and display the uploaded file.
 */
export interface FileUploadResponse {
  /** Unique identifier for file operations (download, delete, etc.) */
  publicId: string;

  /** Original filename as uploaded by user */
  originalFilename: string;

  /** File size in bytes */
  fileSize: number;

  /** Human-readable size (e.g., "2.5 MB") */
  formattedSize: string;

  /** MIME type (e.g., "image/jpeg", "application/pdf") */
  contentType: string;

  /** File category */
  category: FileCategory;

  /** URL to access/download the file */
  accessUrl: string;

  /** Image width in pixels (null for non-images) */
  imageWidth: number | null;

  /** Image height in pixels (null for non-images) */
  imageHeight: number | null;
}
