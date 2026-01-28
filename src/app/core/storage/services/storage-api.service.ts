// src/app/core/storage/services/storage-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FileCategory } from '../models/file-category.enum';
import { FileUploadResponse } from '../models/file-upload-response.model';
import { FileInfoResponse } from '../models/file-info-response.model';
import {AvatarResponse} from '../models/avatar-response.model';

/**
 * Response for file operations (delete, etc.)
 */
export interface FileOperationResponse {
  message: string;
  publicId: string;
}


/**
 * API service for file storage operations.
 *
 * Handles HTTP communication with the backend storage endpoints.
 *
 * Endpoints:
 * - POST   /api/files          → Upload file
 * - GET    /api/files/my       → List user's files
 * - GET    /api/files/:id      → Download file
 * - GET    /api/files/:id/info → Get file metadata
 * - DELETE /api/files/:id      → Delete file
 *
 * @example
 * ```typescript
 * // Upload a file
 * this.storageApi.upload(file, FileCategory.AVATAR).subscribe({
 *   next: (response) => console.log('Uploaded:', response.publicId),
 *   error: (err) => console.error('Upload failed:', err)
 * });
 *
 * // List my files
 * this.storageApi.getMyFiles().subscribe(files => console.log(files));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class StorageApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/files';

  // ===========================================================================
  // UPLOAD
  // ===========================================================================

  /**
   * Uploads a file to the server.
   *
   * @param file - The file to upload
   * @param category - File category (determines validation rules)
   * @param description - Optional description/alt text
   * @returns Observable with upload result containing publicId and accessUrl
   */
  upload(
    file: File,
    category: FileCategory,
    description?: string
  ): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    if (description) {
      formData.append('description', description);
    }

    return this.http.post<FileUploadResponse>(this.baseUrl, formData, {
      withCredentials: true
    });
  }


  /**
   * Uploads an image and sets it as the user's profile avatar.
   *
   * @param file - The avatar image to upload
   * @returns Observable with upload result
   */
  uploadAvatar(file: File): Observable<AvatarResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<AvatarResponse>(
      '/api/profile/avatar',
      formData,
      { withCredentials: true }
    );
  }


  // ===========================================================================
  // READ
  // ===========================================================================

  /**
   * Lists all files owned by the authenticated user.
   *
   * @param category - Optional category filter
   * @returns Observable with array of file metadata
   */
  getMyFiles(category?: FileCategory): Observable<FileInfoResponse[]> {
    const url = category
      ? `${this.baseUrl}/my?category=${category}`
      : `${this.baseUrl}/my`;

    return this.http.get<FileInfoResponse[]>(url, { withCredentials: true });
  }

  /**
   * Gets file metadata without downloading content.
   *
   * @param publicId - The file's public ID
   * @returns Observable with file metadata
   */
  getFileInfo(publicId: string): Observable<FileInfoResponse> {
    return this.http.get<FileInfoResponse>(
      `${this.baseUrl}/${publicId}/info`,
      { withCredentials: true }
    );
  }

  /**
   * Gets the download URL for a file.
   *
   * @param publicId - The file's public ID
   * @returns Full URL to download/access the file
   */
  getDownloadUrl(publicId: string): string {
    return `${this.baseUrl}/${publicId}`;
  }

  // ===========================================================================
  // DELETE
  // ===========================================================================

  /**
   * Deletes a file (soft delete).
   *
   * @param publicId - The file's public ID
   * @returns Observable with operation result
   */
  delete(publicId: string): Observable<FileOperationResponse> {
    return this.http.delete<FileOperationResponse>(
      `${this.baseUrl}/${publicId}`,
      { withCredentials: true }
    );
  }


  /**
   * Removes the user's profile avatar.
   */
  removeAvatar(): Observable<void> {
    return this.http.delete<void>(
      '/api/profile/avatar',
      { withCredentials: true }
    );
  }
}
