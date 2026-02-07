/**
 * Enum representing the recurrence pattern of a calendar event.
 *
 * Aligned with backend enum: be.steby.CoreProject.dl.enums.EventRecurrence
 *
 * @description
 * - NONE: One-time event, no recurrence
 * - DAILY: Repeats every day
 * - WEEKLY: Repeats every week on the same day
 * - MONTHLY: Repeats every month on the same date
 * - YEARLY: Repeats every year on the same date
 *
 * @example
 * ```typescript
 * const event: CalendarEvent = {
 *   recurrence: EventRecurrence.WEEKLY,
 *   // ...
 * };
 * ```
 */
export enum EventRecurrence {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

/**
 * Display names for event recurrence patterns (French localization).
 *
 * @example
 * ```typescript
 * const recurrence = EventRecurrence.WEEKLY;
 * const label = EVENT_RECURRENCE_LABELS[recurrence]; // "Hebdomadaire"
 * ```
 */
export const EVENT_RECURRENCE_LABELS: Record<EventRecurrence, string> = {
  [EventRecurrence.NONE]: 'Aucune',
  [EventRecurrence.DAILY]: 'Quotidien',
  [EventRecurrence.WEEKLY]: 'Hebdomadaire',
  [EventRecurrence.MONTHLY]: 'Mensuel',
  [EventRecurrence.YEARLY]: 'Annuel'
};

/**
 * Utility functions for EventRecurrence.
 */
export const EventRecurrenceUtils = {
  /**
   * Checks if the pattern represents a recurring event.
   */
  isRecurring: (recurrence: EventRecurrence): boolean => {
    return recurrence !== EventRecurrence.NONE;
  },

  /**
   * Returns all recurrence options as an array (useful for dropdowns).
   */
  all: (): EventRecurrence[] => {
    return Object.values(EventRecurrence);
  },

  /**
   * Returns only recurring options (excludes NONE).
   */
  recurringOnly: (): EventRecurrence[] => {
    return Object.values(EventRecurrence).filter(r => r !== EventRecurrence.NONE);
  }
};
