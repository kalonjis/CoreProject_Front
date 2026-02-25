// src/app/features/account/services/gdpr-export-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HttpUtilService } from '../../../core/http/http-util.service';
import { GdprExportStatusResponse } from '../models/gdpr-export.model';

/**
 * GdprExportApiService — HTTP calls for GDPR data export operations.
 *
 * Endpoints:
 * - POST /api/privacy/export/request    authenticated  — initiates an export request
 * - GET  /api/privacy/export/confirm    public         — confirms via email link token
 * - GET  /api/privacy/export/download   public         — downloads the archive (returns Blob)
 * - GET  /api/privacy/export/status     authenticated  — polls current request status
 *
 * Notes:
 * - `request()` and `status()` use HttpUtilService (authenticated, cookie-based).
 * - `confirm()` and `download()` use HttpClient directly:
 *     - They are public endpoints accessed via email links (no session required).
 *     - `download()` requires responseType 'blob', unsupported by HttpUtilService.
 */
@Injectable({ providedIn: 'root' })
export class GdprExportApiService {

  private readonly http    = inject(HttpUtilService);
  private readonly httpRaw = inject(HttpClient);
  private readonly baseUrl = '/api/privacy/export';

  // ===========================================================================
  // REQUEST — authenticated
  // ===========================================================================

  /**
   * Initiates a GDPR data export request.
   *
   * On success, the backend creates a PENDING request and sends a confirmation
   * email. Returns 202 Accepted — the archive is not yet ready.
   *
   * POST /api/privacy/export/request
   */
  request(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/request`, {});
  }

  // ===========================================================================
  // CONFIRM — public (email link)
  // ===========================================================================

  /**
   * Confirms the export request using the single-use token received by email.
   * Triggers asynchronous archive generation on the backend.
   *
   * Returns 202 Accepted — generation has started but is not yet complete.
   * The user will receive a second email when the archive is ready.
   *
   * GET /api/privacy/export/confirm?token=
   *
   * @param token - Single-use token from the confirmation email link.
   */
  confirm(token: string): Observable<void> {
    return this.httpRaw.get<void>(
      `${this.baseUrl}/confirm?token=${encodeURIComponent(token)}`,
      { withCredentials: true }
    );
  }

  // ===========================================================================
  // DOWNLOAD — public (email link)
  // ===========================================================================

  /**
   * Downloads the GDPR archive using the single-use download token.
   *
   * The backend either streams the ZIP directly (local storage)
   * or returns a redirect to a pre-signed URL (R2 / remote storage).
   * In both cases, Angular handles the response as a Blob.
   *
   * After a successful download, the backend marks the request as DOWNLOADED.
   * The file is deleted from storage after the TTL expires.
   *
   * GET /api/privacy/export/download?token=
   *
   * @param token - Single-use download token from the ready email link.
   */
  download(token: string): Observable<Blob> {
    return this.httpRaw.get(
      `${this.baseUrl}/download?token=${encodeURIComponent(token)}`,
      { responseType: 'blob', withCredentials: true }
    );
  }

  // ===========================================================================
  // STATUS — authenticated
  // ===========================================================================

  /**
   * Returns the current GDPR export request status for the authenticated user.
   * Used by the data-export-card to drive UI state on load and during polling.
   *
   * The `status` field in the response is null if no request has ever been made.
   *
   * GET /api/privacy/export/status
   */
  getStatus(): Observable<GdprExportStatusResponse> {
    return this.http.get<GdprExportStatusResponse>(`${this.baseUrl}/status`);
  }
}
