// src/app/features/notification/index.ts

/**
 * Notification Feature Module
 *
 * Public API for the notification system.
 * Provides real-time notifications via SSE, notification center,
 * and user preference management.
 */

// =============================================================================
// MODELS - Enums
// =============================================================================

export {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  NOTIFICATION_TYPE_ICONS,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_CHANNEL_ICONS,
  NOTIFICATION_PRIORITY_COLORS,
  getAllNotificationTypes,
  getAllNotificationChannels,
  isUnreadStatus,
  bypassesQuietHours
} from './models/notification.enums';

// =============================================================================
// MODELS - Notification
// =============================================================================

export type {
  Notification,
  SseNotificationPayload,
  NotificationPageResponse,
  UnreadCountResponse,
  NotificationOperationResponse,
  NotificationFilterState,
  NotificationQueryParams
} from './models/notification.model';

export {
  DEFAULT_NOTIFICATION_FILTER,
  ssePayloadToNotification,
  isNotificationUnread,
  getNotificationIcon,
  getRelativeTime,
  sortNotificationsByDate,
  filterNotifications
} from './models/notification.model';

// =============================================================================
// MODELS - Preferences
// =============================================================================

export type {
  NotificationPreference,
  QuietHoursConfig,
  PreferenceMatrix,
  ChannelPreferenceDetail,
  TypePreferenceDetail,
  UpdatePreferenceRequest,
  SetQuietHoursRequest,
  BulkPreferenceUpdateRequest,
  PreferenceOperationResponse
} from './models/notification-preference.model';

export {
  DigestFrequency,
  DIGEST_FREQUENCY_LABELS,
  createEmptyPreferenceMatrix,
  preferencesToMatrix,
  matrixToPreferences,
  isInQuietHours,
  formatQuietHours
} from './models/notification-preference.model';

// =============================================================================
// MODELS - State
// =============================================================================

export type { NotificationState } from './models/notification.state';

export {
  SseConnectionStatus,
  initialNotificationState,
  isSseConnected,
  isSseError,
  isSseReconnecting
} from './models/notification.state';

// =============================================================================
// STATE
// =============================================================================

export { NotificationStore } from './state/notification.store';

// =============================================================================
// SERVICES
// =============================================================================

export { NotificationApiService } from './services/notification-api.service';
export { NotificationSseService } from './services/notification-sse.service';
export { NotificationFacade } from './services/notification.facade';

// =============================================================================
// COMPONENTS (for use in navbar, app shell, etc.)
// =============================================================================

export { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
export { NotificationToastComponent } from './components/notification-toast/notification-toast.component';
export { NotificationItemComponent } from './components/notification-item/notification-item.component';
export { NotificationDropdownComponent } from './components/notification-dropdown/notification-dropdown.component';
export { NotificationFiltersComponent } from './components/notification-filters/notification-filters.component';

// =============================================================================
// PAGES (lazy-loaded via routes)
// =============================================================================

// Pages are lazy-loaded, but exported for direct import if needed
export { NotificationCenterComponent } from './pages/notification-center/notification-center.component';
export { NotificationPreferencesComponent } from './pages/notification-preferences/notification-preferences.component';

// =============================================================================
// ROUTES
// =============================================================================

export { NOTIFICATION_ROUTES } from './notification.routes';
