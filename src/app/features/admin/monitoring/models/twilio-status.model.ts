// src/app/features/admin/monitoring/models/twilio-status.model.ts

/**
 * Possible Twilio connection states.
 *
 * - UP: Twilio API is reachable and responding
 * - DOWN: Twilio API is unreachable or not responding
 * - UNKNOWN: Status has not been tested yet
 * - TESTING: Connection test is in progress
 */
export type TwilioStatus = 'UP' | 'DOWN' | 'UNKNOWN' | 'TESTING';

/**
 * Twilio health state for the monitoring dashboard.
 *
 * Contains the current Twilio status and additional metadata
 * for display in the System Health header.
 */
export interface TwilioHealthState {
  /** Current connection status */
  status: TwilioStatus;

  /** Last successful response time in milliseconds */
  responseTimeMs: number | null;

  /** Twilio account status (active, suspended, closed) */
  accountStatus: string | null;

  /** Error message if status is DOWN */
  errorMessage: string | null;

  /** Timestamp of last test */
  lastTestedAt: Date | null;
}

/**
 * Creates an initial Twilio health state with unknown status.
 */
export function createInitialTwilioState(): TwilioHealthState {
  return {
    status: 'UNKNOWN',
    responseTimeMs: null,
    accountStatus: null,
    errorMessage: null,
    lastTestedAt: null
  };
}
