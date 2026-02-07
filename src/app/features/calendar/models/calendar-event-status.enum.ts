/**
 * Enum representing the status of a calendar event.
 *
 * Aligned with backend enum: be.steby.CoreProject.dl.enums.EventStatus
 *
 * @description
 * - TENTATIVE: Event is provisional, not yet confirmed
 * - CONFIRMED: Event is definitely happening
 * - CANCELLED: Event has been cancelled
 *
 * @example
 * ```typescript
 * const event: CalendarEvent = {
 *   status: CalendarEventStatus.CONFIRMED,
 *   // ...
 * };
 *
 * if (event.status === CalendarEventStatus.CANCELLED) {
 *   // Apply strikethrough styling
 * }
 * ```
 */
export enum CalendarEventStatus {
  TENTATIVE = 'TENTATIVE',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

/**
 * Display names for calendar event statuses (French localization).
 *
 * @example
 * ```typescript
 * const status = CalendarEventStatus.CONFIRMED;
 * const label = CALENDAR_EVENT_STATUS_LABELS[status]; // "Confirmé"
 * ```
 */
export const CALENDAR_EVENT_STATUS_LABELS: Record<CalendarEventStatus, string> = {
  [CalendarEventStatus.TENTATIVE]: 'Provisoire',
  [CalendarEventStatus.CONFIRMED]: 'Confirmé',
  [CalendarEventStatus.CANCELLED]: 'Annulé'
};

/**
 * Utility functions for CalendarEventStatus.
 */
export const CalendarEventStatusUtils = {
  /**
   * Checks if the status represents a cancelled event.
   */
  isCancelled: (status: CalendarEventStatus): boolean => {
    return status === CalendarEventStatus.CANCELLED;
  },

  /**
   * Checks if the status represents a confirmed event.
   */
  isConfirmed: (status: CalendarEventStatus): boolean => {
    return status === CalendarEventStatus.CONFIRMED;
  },

  /**
   * Checks if the status represents a tentative event.
   */
  isTentative: (status: CalendarEventStatus): boolean => {
    return status === CalendarEventStatus.TENTATIVE;
  },

  /**
   * Returns all statuses as an array (useful for dropdowns).
   */
  all: (): CalendarEventStatus[] => {
    return Object.values(CalendarEventStatus);
  }
};
