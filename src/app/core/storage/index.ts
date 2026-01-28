// src/app/core/storage/index.ts

/**
 * Storage module public API.
 *
 * Provides file upload, download, and management capabilities.
 *
 * @example
 * ```typescript
 * import { StorageApiService, FileCategory, FileUploadResponse } from '@core/storage';
 * ```
 */

// Models
export { FileCategory } from './models/file-category.enum';
export type { FileUploadResponse } from './models/file-upload-response.model';
export type { FileStatus, FileInfoResponse } from './models/file-info-response.model';
export type { AvatarResponse } from './models/avatar-response.model';

// Services
export { StorageApiService } from './services/storage-api.service';
