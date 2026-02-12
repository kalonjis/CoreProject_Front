// src/app/features/notification/models/notification.model.ts

import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  isUnreadStatus,
  NOTIFICATION_TYPE_ICONS
} from './notification.enums';

// =============================================================================
// Core Notification Model
// =============================================================================

/**
 * Notification entity as returned by the API.
 */
export interface Notification {
  /** Unique public identifier */
  publicId: string;

  /** Notification type */
  type: NotificationType;

  /** Priority level */
  priority: NotificationPriority;

  /** Current status */
  status: NotificationStatus;

  /** Notification title */
  title: string;

  /** Notification body/message */
  body: string;

  /** Optional action URL for deep linking */
  actionUrl?: string;

  /** Optional icon override */
  icon?: string;

  /** Channels through which notification was sent */
  channels: NotificationChannel[];

  /** Creation timestamp (ISO string) */
  createdAt: string;

  /** When notification was sent */
  sentAt?: string;

  /** When notification was delivered */
  deliveredAt?: string;

  /** When notification was read */
  readAt?: string;

  /** When notification was dismissed */
  dismissedAt?: string;

  /** Optional expiration timestamp */
  expiresAt?: string;

  /** Optional additional data (JSON) */
  data?: Record<string, unknown>;
}

// =============================================================================
// SSE Payload (lightweight, from real-time stream)
// =============================================================================

/**
 * Notification payload received via SSE.
 * Lighter than full Notification model.
 */
export interface SseNotificationPayload {
  id: string;
  type: string;
  priority: string;
  title: string;
  body: string;
  actionUrl?: string;
  icon?: string;
  createdAt: string;
}

// =============================================================================
// API Response Models
// =============================================================================

/**
 * Paginated notification response from API.
 */
export interface NotificationPageResponse {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Unread count response.
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * Generic operation response.
 */
export interface NotificationOperationResponse {
  success: boolean;
  message?: string;
}

// =============================================================================
// Filter & Query Models
// =============================================================================

/**
 * Notification filter state for UI.
 */
export interface NotificationFilterState {
  /** Show only unread */
  unreadOnly: boolean;

  /** Filter by types (empty = all) */
  types: NotificationType[];

  /** Filter by priority (empty = all) */
  priorities: NotificationPriority[];
}

/**
 * Default filter state.
 */
export const DEFAULT_NOTIFICATION_FILTER: NotificationFilterState = {
  unreadOnly: false,
  types: [],
  priorities: []
};

/**
 * Query parameters for fetching notifications.
 */
export interface NotificationQueryParams {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Converts SSE payload to Notification model.
 */
export function ssePayloadToNotification(payload: SseNotificationPayload): Notification {
  return {
    publicId: payload.id,
    type: payload.type as NotificationType,
    priority: payload.priority as NotificationPriority,
    status: NotificationStatus.DELIVERED,
    title: payload.title,
    body: payload.body,
    actionUrl: payload.actionUrl,
    icon: payload.icon,
    channels: [NotificationChannel.IN_APP],
    createdAt: payload.createdAt,
    deliveredAt: new Date().toISOString()
  };
}

/**
 * Checks if notification is unread.
 */
export function isNotificationUnread(notification: Notification): boolean {
  return isUnreadStatus(notification.status);
}

/**
 * Gets display icon for notification.
 */
export function getNotificationIcon(notification: Notification): string {
  return notification.icon || NOTIFICATION_TYPE_ICONS[notification.type];
}

/**
 * Gets relative time string (e.g., "5 min ago", "2 hours ago").
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

/**
 * Sorts notifications by date (newest first).
 */
export function sortNotificationsByDate(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Filters notifications based on filter state.
 */
export function filterNotifications(
  notifications: Notification[],
  filter: NotificationFilterState
): Notification[] {
  return notifications.filter(n => {
    // Unread filter
    if (filter.unreadOnly && !isNotificationUnread(n)) {
      return false;
    }

    // Type filter
    if (filter.types.length > 0 && !filter.types.includes(n.type)) {
      return false;
    }

    // Priority filter
    if (filter.priorities.length > 0 && !filter.priorities.includes(n.priority)) {
      return false;
    }

    return true;
  });
}
