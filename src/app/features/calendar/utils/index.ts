/**
 * Calendar Utils Barrel Export
 *
 * @description
 * Central export point for all calendar-related utility functions.
 * These are pure, stateless functions with no Angular dependencies.
 *
 * For service-based utilities with DI, use the services module.
 *
 * @example
 * ```typescript
 * import {
 *   getMonthGrid,
 *   groupEventsByDate,
 *   getContrastColor,
 *   getNextOccurrence
 * } from '@features/calendar/utils';
 * ```
 */

// =============================================================================
// Date Utils
// =============================================================================

export {
  // Month grid generation
  getMonthGrid,
  getWeekDayNames,
  getMonthNames,
  getWeeksInMonth,

  // Week number
  getWeekNumber,

  // Date comparisons
  isSameDay,
  isSameMonth,
  isToday,
  isCurrentMonth,
  isWeekend,

  // Time slots
  getTimeSlots,
  timeToMinutes,
  minutesToTime,

  // Date arithmetic
  addDays,
  addMonths,
  addYears,
  getDaysInMonth
} from './calendar-date.utils';

// =============================================================================
// Event Utils
// =============================================================================

export {
  // Filtering
  getEventsForDay,
  getEventsStartingOnDay,
  getUpcomingEvents,
  getEventsInRange,

  // Sorting
  sortEventsByTime,
  sortEventsBy,

  // Grouping
  groupEventsByDate,
  groupEventsByStatus,
  groupEventsByMonth,

  // Position calculation
  calculateEventPositions,
  type PositionedEvent,

  // Statistics
  calculateEventStats
} from './calendar-event.utils';

// =============================================================================
// Color Utils
// =============================================================================

export {
  // Palettes
  DEFAULT_EVENT_COLORS,
  EXTENDED_EVENT_COLORS,
  getColorOptions,
  type ColorOption,

  // Contrast
  getContrastColor,
  getContrastRatio,
  meetsContrastRequirements,

  // Manipulation
  lightenColor,
  darkenColor,
  toTransparent,
  getLightVariant,

  // Conversion
  hexToRgb,
  rgbToHex,

  // Random/deterministic
  getRandomEventColor,
  getColorFromString
} from './calendar-color.utils';

// =============================================================================
// Recurrence Utils
// =============================================================================

export {
  // Next/previous occurrence
  getNextOccurrence,
  getPreviousOccurrence,

  // Occurrence generation
  generateOccurrences,
  generateEventInstances,

  // Recurrence info
  getRecurrenceDescription,
  countOccurrences,
  occursOnDate,

  // Helpers
  getRecurrenceIntervalDays,
  isRecurrenceReasonableForRange
} from './calendar-recurrence.utils';
