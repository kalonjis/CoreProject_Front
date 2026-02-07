import {
  CalendarEvent,
  CalendarEventStatus,
  CalendarEventStatusUtils
} from '../models';
import { isSameDay } from './calendar-date.utils';

/**
 * Pure utility functions for calendar event manipulation.
 *
 * @description
 * Stateless helper functions for filtering, sorting, grouping,
 * and positioning events in calendar views.
 *
 * @example
 * ```typescript
 * import {
 *   groupEventsByDate,
 *   sortEventsByTime,
 *   getEventsForDay
 * } from '@features/calendar/utils';
 * ```
 */

// =============================================================================
// Filtering
// =============================================================================

/**
 * Gets events that occur on a specific day.
 *
 * @param events - Array of calendar events
 * @param date - Target date
 * @returns Events that occur on the given day
 *
 * @example
 * ```typescript
 * const todayEvents = getEventsForDay(events, new Date());
 * ```
 */
export function getEventsForDay(
  events: CalendarEvent[],
  date: Date
): CalendarEvent[] {
  return events.filter(event => {
    const eventStart = new Date(event.startDateTime);
    const eventEnd = new Date(event.endDateTime);

    // Check if the event spans this day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return eventStart <= dayEnd && eventEnd >= dayStart;
  });
}

/**
 * Gets events that start on a specific day.
 *
 * @param events - Array of calendar events
 * @param date - Target date
 * @returns Events that start on the given day
 */
export function getEventsStartingOnDay(
  events: CalendarEvent[],
  date: Date
): CalendarEvent[] {
  return events.filter(event => {
    const eventStart = new Date(event.startDateTime);
    return isSameDay(eventStart, date);
  });
}

/**
 * Gets upcoming events (not cancelled, starting from now).
 *
 * @param events - Array of calendar events
 * @param limit - Maximum number of events to return (optional)
 * @returns Upcoming events sorted by start time
 */
export function getUpcomingEvents(
  events: CalendarEvent[],
  limit?: number
): CalendarEvent[] {
  const now = new Date();

  const upcoming = events
    .filter(event =>
      new Date(event.startDateTime) >= now &&
      !CalendarEventStatusUtils.isCancelled(event.status)
    )
    .sort((a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

  return limit ? upcoming.slice(0, limit) : upcoming;
}

/**
 * Gets events within a date range.
 *
 * @param events - Array of calendar events
 * @param start - Range start date
 * @param end - Range end date
 * @returns Events that overlap with the range
 */
export function getEventsInRange(
  events: CalendarEvent[],
  start: Date,
  end: Date
): CalendarEvent[] {
  return events.filter(event => {
    const eventStart = new Date(event.startDateTime);
    const eventEnd = new Date(event.endDateTime);
    return eventStart <= end && eventEnd >= start;
  });
}

// =============================================================================
// Sorting
// =============================================================================

/**
 * Sorts events by start time (ascending).
 *
 * @param events - Array of calendar events
 * @returns New sorted array
 */
export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) =>
    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );
}

/**
 * Sorts events by multiple criteria.
 *
 * @param events - Array of calendar events
 * @param criteria - Sort criteria in priority order
 * @returns New sorted array
 *
 * @example
 * ```typescript
 * sortEventsBy(events, ['status', 'startDateTime']);
 * ```
 */
export function sortEventsBy(
  events: CalendarEvent[],
  criteria: Array<'startDateTime' | 'endDateTime' | 'title' | 'status'>
): CalendarEvent[] {
  return [...events].sort((a, b) => {
    for (const criterion of criteria) {
      let comparison = 0;

      switch (criterion) {
        case 'startDateTime':
        case 'endDateTime':
          comparison = new Date(a[criterion]).getTime() - new Date(b[criterion]).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  });
}

// =============================================================================
// Grouping
// =============================================================================

/**
 * Groups events by date (YYYY-MM-DD key).
 *
 * @param events - Array of calendar events
 * @returns Map with date keys and event arrays
 *
 * @example
 * ```typescript
 * const grouped = groupEventsByDate(events);
 * const feb10Events = grouped.get('2025-02-10');
 * ```
 */
export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dateKey = event.startDateTime.split('T')[0];
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, event]);
  }

  // Sort events within each group
  for (const [key, value] of grouped) {
    grouped.set(key, sortEventsByTime(value));
  }

  return grouped;
}

/**
 * Groups events by status.
 *
 * @param events - Array of calendar events
 * @returns Map with status keys and event arrays
 */
export function groupEventsByStatus(
  events: CalendarEvent[]
): Map<CalendarEventStatus, CalendarEvent[]> {
  const grouped = new Map<CalendarEventStatus, CalendarEvent[]>();

  for (const status of Object.values(CalendarEventStatus)) {
    grouped.set(status, []);
  }

  for (const event of events) {
    const existing = grouped.get(event.status) || [];
    grouped.set(event.status, [...existing, event]);
  }

  return grouped;
}

/**
 * Groups events by month (YYYY-MM key).
 *
 * @param events - Array of calendar events
 * @returns Map with month keys and event arrays
 */
export function groupEventsByMonth(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const monthKey = event.startDateTime.substring(0, 7); // YYYY-MM
    const existing = grouped.get(monthKey) || [];
    grouped.set(monthKey, [...existing, event]);
  }

  return grouped;
}

// =============================================================================
// Position Calculation (for overlapping events)
// =============================================================================

/**
 * Event with calculated position for rendering.
 */
export interface PositionedEvent {
  event: CalendarEvent;
  column: number;
  totalColumns: number;
  top: number;      // Percentage from top
  height: number;   // Percentage height
}

/**
 * Calculates positions for overlapping events in a day view.
 *
 * @description
 * Assigns column positions to events that overlap in time,
 * so they can be rendered side by side.
 *
 * @param events - Events for a single day
 * @param dayStartHour - Start hour of the view (default: 0)
 * @param dayEndHour - End hour of the view (default: 24)
 * @returns Events with position information
 *
 * @example
 * ```typescript
 * const positioned = calculateEventPositions(dayEvents, 8, 18);
 * // Each event now has column, totalColumns, top, and height
 * ```
 */
export function calculateEventPositions(
  events: CalendarEvent[],
  dayStartHour: number = 0,
  dayEndHour: number = 24
): PositionedEvent[] {
  if (events.length === 0) return [];

  const dayMinutes = (dayEndHour - dayStartHour) * 60;
  const sorted = sortEventsByTime(events);

  // Find overlapping groups
  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [];
  let groupEnd = 0;

  for (const event of sorted) {
    const eventStart = new Date(event.startDateTime);
    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();

    if (currentGroup.length === 0 || startMinutes < groupEnd) {
      // Add to current group
      currentGroup.push(event);
      const eventEnd = new Date(event.endDateTime);
      const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
      groupEnd = Math.max(groupEnd, endMinutes);
    } else {
      // Start new group
      groups.push(currentGroup);
      currentGroup = [event];
      const eventEnd = new Date(event.endDateTime);
      groupEnd = eventEnd.getHours() * 60 + eventEnd.getMinutes();
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Assign columns within each group
  const positioned: PositionedEvent[] = [];

  for (const group of groups) {
    const totalColumns = group.length;

    group.forEach((event, index) => {
      const eventStart = new Date(event.startDateTime);
      const eventEnd = new Date(event.endDateTime);

      const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
      const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();

      const top = ((startMinutes - dayStartHour * 60) / dayMinutes) * 100;
      const height = ((endMinutes - startMinutes) / dayMinutes) * 100;

      positioned.push({
        event,
        column: index,
        totalColumns,
        top: Math.max(0, top),
        height: Math.max(2, height) // Minimum 2% height for visibility
      });
    });
  }

  return positioned;
}

// =============================================================================
// Statistics
// =============================================================================

/**
 * Calculates statistics for a set of events.
 *
 * @param events - Array of calendar events
 * @returns Statistics object
 */
export function calculateEventStats(events: CalendarEvent[]): {
  total: number;
  byStatus: Record<CalendarEventStatus, number>;
  upcoming: number;
  past: number;
  allDay: number;
  recurring: number;
} {
  const now = new Date();

  const byStatus = {
    [CalendarEventStatus.TENTATIVE]: 0,
    [CalendarEventStatus.CONFIRMED]: 0,
    [CalendarEventStatus.CANCELLED]: 0
  };

  let upcoming = 0;
  let past = 0;
  let allDay = 0;
  let recurring = 0;

  for (const event of events) {
    byStatus[event.status]++;

    if (new Date(event.startDateTime) > now) {
      upcoming++;
    } else {
      past++;
    }

    if (event.allDay) {
      allDay++;
    }

    if (event.recurrence !== 'NONE') {
      recurring++;
    }
  }

  return {
    total: events.length,
    byStatus,
    upcoming,
    past,
    allDay,
    recurring
  };
}
