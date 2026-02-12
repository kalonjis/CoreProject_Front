// src/app/features/notification/models/notification-preference.model.ts

import { NotificationType, NotificationChannel } from './notification.enums';

// =============================================================================
// Preference Models
// =============================================================================

/**
 * Single notification preference entry.
 */
export interface NotificationPreference {
  /** Notification type */
  notificationType: NotificationType;

  /** Delivery channel */
  channel: NotificationChannel;

  /** Whether this channel is enabled for this type */
  enabled: boolean;

  /** Quiet hours start time (HH:mm format) */
  quietHoursStart?: string;

  /** Quiet hours end time (HH:mm format) */
  quietHoursEnd?: string;

  /** Whether digest mode is enabled (email only) */
  digestEnabled: boolean;

  /** Digest frequency if enabled */
  digestFrequency?: DigestFrequency;
}

/**
 * Digest frequency options.
 */
export enum DigestFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY'
}

/**
 * Quiet hours configuration.
 */
export interface QuietHoursConfig {
  enabled: boolean;
  start: string;  // HH:mm format
  end: string;    // HH:mm format
}

// =============================================================================
// Preference Matrix (for UI display)
// =============================================================================

/**
 * Full preference matrix: type → channel → enabled.
 * Used for the preferences page grid display.
 */
export type PreferenceMatrix = Record<NotificationType, Record<NotificationChannel, boolean>>;

/**
 * Channel preference with all settings.
 */
export interface ChannelPreferenceDetail {
  channel: NotificationChannel;
  enabled: boolean;
  quietHours?: QuietHoursConfig;
  digestEnabled?: boolean;
  digestFrequency?: DigestFrequency;
}

/**
 * Type preference with all channel details.
 */
export interface TypePreferenceDetail {
  type: NotificationType;
  channels: ChannelPreferenceDetail[];
}

// =============================================================================
// API Request/Response Models
// =============================================================================

/**
 * Request to update a single preference.
 */
export interface UpdatePreferenceRequest {
  notificationType: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
}

/**
 * Request to set quiet hours.
 */
export interface SetQuietHoursRequest {
  channel: NotificationChannel;
  start: string;  // HH:mm format
  end: string;    // HH:mm format
}

/**
 * Request to update digest settings.
 */
export interface UpdateDigestRequest {
  notificationType: NotificationType;
  enabled: boolean;
  frequency?: DigestFrequency;
}

/**
 * Bulk preference update request.
 */
export interface BulkPreferenceUpdateRequest {
  preferences: UpdatePreferenceRequest[];
}

/**
 * API response for preference operations.
 */
export interface PreferenceOperationResponse {
  success: boolean;
  message?: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Creates an empty preference matrix with all values set to false.
 */
export function createEmptyPreferenceMatrix(): PreferenceMatrix {
  const matrix: Partial<PreferenceMatrix> = {};

  for (const type of Object.values(NotificationType)) {
    matrix[type] = {} as Record<NotificationChannel, boolean>;
    for (const channel of Object.values(NotificationChannel)) {
      matrix[type]![channel] = false;
    }
  }

  return matrix as PreferenceMatrix;
}

/**
 * Converts preference list to matrix format.
 */
export function preferencesToMatrix(preferences: NotificationPreference[]): PreferenceMatrix {
  const matrix = createEmptyPreferenceMatrix();

  for (const pref of preferences) {
    if (matrix[pref.notificationType]) {
      matrix[pref.notificationType][pref.channel] = pref.enabled;
    }
  }

  return matrix;
}

/**
 * Converts matrix back to preference list (for API updates).
 */
export function matrixToPreferences(matrix: PreferenceMatrix): UpdatePreferenceRequest[] {
  const preferences: UpdatePreferenceRequest[] = [];

  for (const type of Object.values(NotificationType)) {
    for (const channel of Object.values(NotificationChannel)) {
      preferences.push({
        notificationType: type,
        channel: channel,
        enabled: matrix[type][channel]
      });
    }
  }

  return preferences;
}

/**
 * Checks if quiet hours are currently active.
 */
export function isInQuietHours(config: QuietHoursConfig): boolean {
  if (!config.enabled) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const start = config.start;
  const end = config.end;

  // Handle overnight range (e.g., 22:00 - 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  return currentTime >= start && currentTime < end;
}

/**
 * Formats quiet hours for display.
 */
export function formatQuietHours(config: QuietHoursConfig): string {
  if (!config.enabled) return 'Disabled';
  return `${config.start} - ${config.end}`;
}

/**
 * Digest frequency labels.
 */
export const DIGEST_FREQUENCY_LABELS: Record<DigestFrequency, string> = {
  [DigestFrequency.DAILY]: 'Daily',
  [DigestFrequency.WEEKLY]: 'Weekly'
};
