// src/app/features/admin/monitoring/models/smtp-status.model.ts

/**
 * Possible SMTP connection states.
 *
 * - UP: SMTP server is reachable and responding
 * - DOWN: SMTP server is unreachable or not responding
 * - UNKNOWN: Status has not been tested yet
 * - TESTING: Connection test is in progress
 */
export type SmtpStatus = 'UP' | 'DOWN' | 'UNKNOWN' | 'TESTING';

/**
 * SMTP health state for the monitoring dashboard.
 *
 * Contains the current SMTP status and additional metadata
 * for display in the System Health header.
 */
export interface SmtpHealthState {
  /** Current connection status */
  status: SmtpStatus;

  /** Last successful response time in milliseconds */
  responseTimeMs: number | null;

  /** Error message if status is DOWN */
  errorMessage: string | null;

  /** Timestamp of last test */
  lastTestedAt: Date | null;
}

/**
 * Creates an initial SMTP health state with unknown status.
 */
export function createInitialSmtpState(): SmtpHealthState {
  return {
    status: 'UNKNOWN',
    responseTimeMs: null,
    errorMessage: null,
    lastTestedAt: null
  };
}
