// src/app/features/notification/models/notification.enums.ts

/**
 * Types of notifications in the system.
 * Matches backend NotificationType enum.
 */
export enum NotificationType {
  REMINDER = 'REMINDER',
  CONFIRMATION = 'CONFIRMATION',
  ALERT = 'ALERT',
  SECURITY = 'SECURITY',
  SOCIAL = 'SOCIAL',
  INFO = 'INFO',
  SYSTEM = 'SYSTEM'
}

/**
 * Notification delivery channels.
 * Matches backend NotificationChannel enum.
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS'
}

/**
 * Notification lifecycle status.
 * Matches backend NotificationStatus enum.
 */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  DISMISSED = 'DISMISSED',
  FAILED = 'FAILED'
}

/**
 * Notification priority levels.
 * Matches backend NotificationPriority enum.
 */
export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// =============================================================================
// Display Configuration
// =============================================================================

/**
 * Icons for each notification type.
 */
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  [NotificationType.REMINDER]: '🔔',
  [NotificationType.CONFIRMATION]: '✅',
  [NotificationType.ALERT]: '⚠️',
  [NotificationType.SECURITY]: '🔒',
  [NotificationType.SOCIAL]: '👥',
  [NotificationType.INFO]: 'ℹ️',
  [NotificationType.SYSTEM]: '⚙️'
};

/**
 * Labels for each notification type.
 */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.REMINDER]: 'Reminder',
  [NotificationType.CONFIRMATION]: 'Confirmation',
  [NotificationType.ALERT]: 'Alert',
  [NotificationType.SECURITY]: 'Security',
  [NotificationType.SOCIAL]: 'Social',
  [NotificationType.INFO]: 'Information',
  [NotificationType.SYSTEM]: 'System'
};

/**
 * Labels for each channel.
 */
export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  [NotificationChannel.IN_APP]: 'In-App',
  [NotificationChannel.EMAIL]: 'Email',
  [NotificationChannel.PUSH]: 'Push',
  [NotificationChannel.SMS]: 'SMS'
};

/**
 * Icons for each channel.
 */
export const NOTIFICATION_CHANNEL_ICONS: Record<NotificationChannel, string> = {
  [NotificationChannel.IN_APP]: '📱',
  [NotificationChannel.EMAIL]: '📧',
  [NotificationChannel.PUSH]: '🔔',
  [NotificationChannel.SMS]: '💬'
};

/**
 * Priority colors for styling.
 */
export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: '#6b7280',      // gray
  [NotificationPriority.NORMAL]: '#3b82f6',   // blue
  [NotificationPriority.HIGH]: '#f59e0b',     // amber
  [NotificationPriority.URGENT]: '#ef4444'    // red
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Gets all notification types as array.
 */
export function getAllNotificationTypes(): NotificationType[] {
  return Object.values(NotificationType);
}

/**
 * Gets all notification channels as array.
 */
export function getAllNotificationChannels(): NotificationChannel[] {
  return Object.values(NotificationChannel);
}

/**
 * Checks if a notification is unread.
 */
export function isUnreadStatus(status: NotificationStatus): boolean {
  return status === NotificationStatus.PENDING
    || status === NotificationStatus.SENT
    || status === NotificationStatus.DELIVERED;
}

/**
 * Checks if priority should bypass quiet hours.
 */
export function bypassesQuietHours(priority: NotificationPriority): boolean {
  return priority === NotificationPriority.URGENT;
}
