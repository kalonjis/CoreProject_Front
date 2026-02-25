// src/app/features/account/models/gdpr-export.model.ts

// =============================================================================
// STATUS ENUM
// =============================================================================

/**
 * Lifecycle status of a GDPR data export request.
 * Mirrors the backend enum: be.steby.CoreProject.dl.enums.GdprExportStatus
 *
 * State transitions:
 * ```
 * PENDING → PROCESSING → READY → DOWNLOADED
 *                              ↘ EXPIRED
 *         ↘ FAILED
 * ```
 *
 * `null` is a valid state meaning no request has ever been made by the user.
 */
export enum GdprExportStatus {
  /** Confirmation email sent — waiting for the user to click the link. */
  PENDING     = 'PENDING',

  /** Archive is being generated asynchronously. */
  PROCESSING  = 'PROCESSING',

  /** Archive is ready — download link has been sent by email. */
  READY       = 'READY',

  /** Archive has been downloaded. File is deleted from storage immediately after. */
  DOWNLOADED  = 'DOWNLOADED',

  /** Download link TTL expired before the user downloaded it. */
  EXPIRED     = 'EXPIRED',

  /** Archive generation failed due to an internal error. */
  FAILED      = 'FAILED',
}

// =============================================================================
// RESPONSE DTO
// =============================================================================

/**
 * Status response returned by GET /api/privacy/export/status.
 * Mirrors the backend record: GdprExportStatusResponse.
 *
 * The `status` field drives the entire UI state of the data-export-card:
 * - `null`       → no request ever made  → show "Request export" button
 * - `PENDING`    → email sent            → show "Check your inbox" + stepper step 1
 * - `PROCESSING` → generating            → show spinner + stepper step 2
 * - `READY`      → archive ready         → show "Download link sent" + stepper step 3
 * - `DOWNLOADED` → already downloaded    → show "Request a new export"
 * - `EXPIRED`    → link expired          → show "Request a new export"
 * - `FAILED`     → generation error      → show error message + "Try again"
 */
export interface GdprExportStatusResponse {
  /** Current lifecycle status. Null if no request has ever been made. */
  status: GdprExportStatus | null;

  /** ISO-8601 timestamp of when the request was initiated. Null if no request. */
  requestedAt: string | null;

  /** ISO-8601 expiry timestamp of the download link. Only set when status is READY. */
  expiresAt: string | null;

  /** True if the archive is available for download right now. */
  downloadReady: boolean;
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Returns true if the given status requires active polling.
 * The data-export-card should poll GET /status while in these states.
 */
export function isPollingStatus(status: GdprExportStatus | null): boolean {
  return status === GdprExportStatus.PENDING || status === GdprExportStatus.PROCESSING;
}

/**
 * Returns true if the given status is terminal (no further transitions expected).
 * Polling should stop in these states.
 */
export function isTerminalStatus(status: GdprExportStatus | null): boolean {
  return (
    status === null ||
    status === GdprExportStatus.READY      ||
    status === GdprExportStatus.DOWNLOADED ||
    status === GdprExportStatus.EXPIRED    ||
    status === GdprExportStatus.FAILED
  );
}
