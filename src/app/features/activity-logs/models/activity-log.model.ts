import {ActivityLogCategory} from './activity-log-category.enum';

/**
 *
 * Device fields:
 * - actorDeviceId  — device that initiated the action (session origin); null for system events
 * - targetDeviceId — device affected by the action (e.g. remote disconnection); null if not applicable
 *
 * Target user information (admin acting on another user) is not a dedicated field —
 * it is embedded in actionDetails as a narrative string.
 */
export interface ActivityLog {
  publicId: string;
  actionType: string;
  actionCategory: ActivityLogCategory;
  successful: boolean;
  failureReason: string | null;
  actionDetails: string | null;
  actorUsername: string | null;   // null for system or public (unauthenticated) events
  actorDeviceId: string | null;
  targetDeviceId: string | null;
  ipAddress: string | null;
  location: string | null;
  timestamp: string; // ISO 8601 — convert to Date on display
}

/**
 * Mirrors ActivityLogStatsResponse.java
 */
export interface ActivityLogStats {
  countsByCategory: Record<ActivityLogCategory | string, number>;
  total: number;
}

/**
 * Spring Page<ActivityLog> response shape.
 * Used by all paginated endpoints.
 */
export interface ActivityLogPage {
  content: ActivityLog[];
  totalElements: number;
  totalPages: number;
  number: number;       // current page (0-based)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Filter params sent as query params to admin endpoints.
 * All fields optional — null means "no filter".
 */
export interface ActivityLogFilter {
  category?: ActivityLogCategory | string | null;
  from?: string | null;       // ISO date yyyy-MM-dd
  to?: string | null;         // ISO date yyyy-MM-dd
  successful?: boolean | null;
  page?: number;
  size?: number;
}
