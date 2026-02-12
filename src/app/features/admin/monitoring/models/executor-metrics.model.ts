// src/app/features/admin/monitoring/models/executor-metrics.model.ts

/**
 * Async executor thread pool metrics.
 *
 * Provides visibility into async task processing capacity and load.
 * Used to detect saturation before tasks start getting rejected.
 *
 * Key indicators:
 * - queueUsagePercent > 70% = Warning (approaching saturation)
 * - queueUsagePercent > 90% = Critical (risk of RejectedExecutionException)
 * - saturated = true = Executor is overloaded
 *
 * Why monitor executors?
 * Circuit breakers protect against external service failures, but executor
 * saturation causes task rejection BEFORE the external call is made.
 * This creates silent failures that circuit breakers cannot detect.
 */
export interface ExecutorMetrics {
  /** Executor identifier (e.g., "email", "sms", "geocoding") */
  name: string;

  /** Threads currently executing tasks */
  activeCount: number;

  /** Current number of threads in the pool */
  poolSize: number;

  /** Configured minimum threads (always kept alive) */
  corePoolSize: number;

  /** Configured maximum threads */
  maxPoolSize: number;

  /** Tasks currently waiting in the queue */
  queueSize: number;

  /** Maximum queue capacity (-1 if unbounded) */
  queueCapacity: number;

  /** Queue usage percentage (0-100) */
  queueUsagePercent: number;

  /** Total tasks completed since startup */
  completedTaskCount: number;

  /** True if executor shows signs of saturation */
  saturated: boolean;
}

/**
 * Display configuration for an executor.
 * Maps executor names to human-readable labels and icons.
 */
export interface ExecutorDisplayConfig {
  /** Human-readable label */
  label: string;

  /** Emoji icon for display */
  icon: string;

  /** Short description of what this executor handles */
  description: string;
}

/**
 * Default display configurations for known executors.
 */
export const EXECUTOR_DISPLAY_CONFIG: Record<string, ExecutorDisplayConfig> = {
  email: {
    label: 'Email',
    icon: '📧',
    description: 'Email sending operations'
  },
  sms: {
    label: 'SMS',
    icon: '📱',
    description: 'SMS sending via Twilio'
  },
  activityLog: {
    label: 'Activity Log',
    icon: '📝',
    description: 'Activity log persistence'
  },
  eventListener: {
    label: 'Event Listener',
    icon: '🔔',
    description: 'Event listener processing'
  },
  geocoding: {
    label: 'Geocoding',
    icon: '🌍',
    description: 'Address geocoding API calls'
  },
  general: {
    label: 'General',
    icon: '⚡',
    description: 'General purpose async tasks'
  },
  notification: {
    label: 'Notification',
    icon: '🔔',
    description: 'Notification processing'
  },
  securityMonitoring: {
    label: 'Security',
    icon: '🔒',
    description: 'Security monitoring tasks'
  }
};
