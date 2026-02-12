// src/app/features/notification/models/notification.state.ts

import { Notification, NotificationFilterState, DEFAULT_NOTIFICATION_FILTER } from './notification.model';
import { NotificationPreference, PreferenceMatrix } from './notification-preference.model';

// =============================================================================
// SSE Connection State
// =============================================================================

/**
 * SSE connection status.
 */
export enum SseConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

// =============================================================================
// Notification State
// =============================================================================

/**
 * Complete notification feature state.
 */
export interface NotificationState {
  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  /** List of notifications (recent/loaded) */
  notifications: Notification[];

  /** Unread notification count */
  unreadCount: number;

  /** Total notification count (for pagination) */
  totalCount: number;

  /** Current page (0-indexed) */
  currentPage: number;

  /** Whether there are more pages to load */
  hasMore: boolean;

  /** Active filter state */
  filter: NotificationFilterState;

  // ---------------------------------------------------------------------------
  // Preferences
  // ---------------------------------------------------------------------------

  /** User's notification preferences */
  preferences: NotificationPreference[];

  /** Preference matrix for UI grid */
  preferenceMatrix: PreferenceMatrix | null;

  // ---------------------------------------------------------------------------
  // SSE Connection
  // ---------------------------------------------------------------------------

  /** SSE connection status */
  sseStatus: SseConnectionStatus;

  /** Number of reconnection attempts */
  reconnectAttempts: number;

  // ---------------------------------------------------------------------------
  // UI State
  // ---------------------------------------------------------------------------

  /** Loading state for notifications */
  isLoading: boolean;

  /** Loading state for preferences */
  isLoadingPreferences: boolean;

  /** Whether dropdown is open */
  isDropdownOpen: boolean;

  /** Error message */
  error: string | null;

  // ---------------------------------------------------------------------------
  // Toast Queue
  // ---------------------------------------------------------------------------

  /** Queue of notifications to show as toasts */
  toastQueue: Notification[];

  /** Currently displayed toast */
  currentToast: Notification | null;
}

// =============================================================================
// Initial State
// =============================================================================

/**
 * Initial notification state.
 */
export const initialNotificationState: NotificationState = {
  // Notifications
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  currentPage: 0,
  hasMore: true,
  filter: DEFAULT_NOTIFICATION_FILTER,

  // Preferences
  preferences: [],
  preferenceMatrix: null,

  // SSE Connection
  sseStatus: SseConnectionStatus.DISCONNECTED,
  reconnectAttempts: 0,

  // UI State
  isLoading: false,
  isLoadingPreferences: false,
  isDropdownOpen: false,
  error: null,

  // Toast
  toastQueue: [],
  currentToast: null
};

// =============================================================================
// State Helpers
// =============================================================================

/**
 * Checks if SSE is connected.
 */
export function isSseConnected(state: NotificationState): boolean {
  return state.sseStatus === SseConnectionStatus.CONNECTED;
}

/**
 * Checks if SSE is in an error state.
 */
export function isSseError(state: NotificationState): boolean {
  return state.sseStatus === SseConnectionStatus.ERROR;
}

/**
 * Checks if currently reconnecting.
 */
export function isSseReconnecting(state: NotificationState): boolean {
  return state.sseStatus === SseConnectionStatus.RECONNECTING;
}

/**
 * Gets a summary of the current state (for debugging).
 */
export function getStateSummary(state: NotificationState): string {
  return `Notifications: ${state.notifications.length}, ` +
    `Unread: ${state.unreadCount}, ` +
    `SSE: ${state.sseStatus}, ` +
    `Loading: ${state.isLoading}`;
}
