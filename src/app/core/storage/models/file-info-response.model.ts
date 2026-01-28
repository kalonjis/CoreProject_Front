// src/app/core/storage/models/file-info-response.model.ts

import { FileCategory } from './file-category.enum';

/**
 * File status matching backend FileStatus enum.
 */
export enum FileStatus {
  /** File is active and accessible */
  ACTIVE = 'ACTIVE',

  /** File is soft-deleted, pending physical removal */
  DELETED = 'DELETED',

  /** Temporary file, will be auto-cleaned */
  TEMPORARY = 'TEMPORARY'
}

/**
 * Detailed file metadata for display and management.
 *
 * Maps to backend FileInfoResponse record.
 * Used for file listings and info queries.
 */
export interface FileInfoResponse {
  /** Unique identifier for file operations */
  publicId: string;

  /** Original filename as uploaded */
  originalFilename: string;

  /** File size in bytes */
  fileSize: number;

  /** Human-readable size (e.g., "2.5 MB") */
  formattedSize: string;

  /** MIME type */
  contentType: string;

  /** File category */
  category: FileCategory;

  /** Current file status */
  status: FileStatus;

  /** URL to access/download the file */
  accessUrl: string;

  /** Optional description/alt text */
  description: string | null;

  /** Image width in pixels (null for non-images) */
  imageWidth: number | null;

  /** Image height in pixels (null for non-images) */
  imageHeight: number | null;

  /** Upload timestamp (ISO string) */
  createdAt: string;

  /** Whether file is publicly accessible */
  isPublic: boolean;
}
