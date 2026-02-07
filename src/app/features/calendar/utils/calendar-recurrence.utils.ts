import { CalendarEvent, EventRecurrence } from '../models';
import { addDays, addMonths, addYears } from './calendar-date.utils';

/**
 * Pure utility functions for handling recurring events.
 *
 * @description
 * Provides functions to calculate next occurrences, generate
 * instances, and work with recurrence patterns.
 *
 * Note: The backend handles actual recurrence storage and expansion.
 * These utilities are for client-side display and calculation.
 *
 * @example
 * ```typescript
 * import {
 *   getNextOccurrence,
 *   generateOccurrences
 * } from '@features/calendar/utils';
 * ```
 */

// =============================================================================
// Next Occurrence Calculation
// =============================================================================

/**
 * Calculates the next occurrence of a recurring event.
 *
 * @param event - The recurring event
 * @param fromDate - Calculate next occurrence from this date (default: now)
 * @returns Next occurrence date, or null if not recurring
 *
 * @example
 * ```typescript
 * const event = { recurrence: EventRecurrence.WEEKLY, startDateTime: '...' };
 * const next = getNextOccurrence(event);
 * // Returns the next weekly occurrence
 * ```
 */
export function getNextOccurrence(
  event: CalendarEvent,
  fromDate: Date = new Date()
): Date | null {
  if (event.recurrence === EventRecurrence.NONE) {
    return null;
  }

  const eventStart = new Date(event.startDateTime);

  // If the event hasn't started yet, return its start date
  if (eventStart > fromDate) {
    return eventStart;
  }

  // Calculate next occurrence based on recurrence pattern
  let nextDate = new Date(eventStart);

  while (nextDate <= fromDate) {
    nextDate = addInterval(nextDate, event.recurrence);
  }

  return nextDate;
}

/**
 * Calculates the previous occurrence of a recurring event.
 *
 * @param event - The recurring event
 * @param fromDate - Calculate previous occurrence from this date
 * @returns Previous occurrence date, or null if not recurring
 */
export function getPreviousOccurrence(
  event: CalendarEvent,
  fromDate: Date = new Date()
): Date | null {
  if (event.recurrence === EventRecurrence.NONE) {
    return null;
  }

  const eventStart = new Date(event.startDateTime);

  // If the event starts after fromDate, there's no previous occurrence
  if (eventStart > fromDate) {
    return null;
  }

  // Find the occurrence just before fromDate
  let current = new Date(eventStart);
  let previous: Date | null = null;

  while (current < fromDate) {
    previous = new Date(current);
    current = addInterval(current, event.recurrence);
  }

  return previous;
}

// =============================================================================
// Occurrence Generation
// =============================================================================

/**
 * Generates a list of occurrences for a recurring event within a date range.
 *
 * @param event - The recurring event
 * @param rangeStart - Start of the date range
 * @param rangeEnd - End of the date range
 * @param maxOccurrences - Maximum number of occurrences to generate (default: 100)
 * @returns Array of occurrence dates
 *
 * @example
 * ```typescript
 * const occurrences = generateOccurrences(
 *   weeklyMeeting,
 *   new Date('2025-02-01'),
 *   new Date('2025-03-31')
 * );
 * // Returns all weekly occurrences in Feb-March
 * ```
 */
export function generateOccurrences(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number = 100
): Date[] {
  if (event.recurrence === EventRecurrence.NONE) {
    // Non-recurring event: return start date if in range
    const start = new Date(event.startDateTime);
    if (start >= rangeStart && start <= rangeEnd) {
      return [start];
    }
    return [];
  }

  const occurrences: Date[] = [];
  const eventStart = new Date(event.startDateTime);

  // Start from event start or range start, whichever is later
  let current = new Date(eventStart);

  // Fast-forward to range start if needed
  while (current < rangeStart && occurrences.length < maxOccurrences) {
    current = addInterval(current, event.recurrence);
  }

  // Generate occurrences within range
  while (current <= rangeEnd && occurrences.length < maxOccurrences) {
    occurrences.push(new Date(current));
    current = addInterval(current, event.recurrence);
  }

  return occurrences;
}

/**
 * Generates event instances (full CalendarEvent objects) for occurrences.
 *
 * @description
 * Creates virtual event objects for each occurrence, useful for
 * rendering in calendar views.
 *
 * @param event - The recurring event
 * @param rangeStart - Start of the date range
 * @param rangeEnd - End of the date range
 * @returns Array of virtual event objects
 */
export function generateEventInstances(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const occurrences = generateOccurrences(event, rangeStart, rangeEnd);
  const eventDuration = getEventDuration(event);

  return occurrences.map((occurrence, index) => {
    const endDateTime = new Date(occurrence.getTime() + eventDuration);

    return {
      ...event,
      // Mark as virtual instance (not stored in DB)
      publicId: `${event.publicId}_instance_${index}`,
      startDateTime: occurrence.toISOString(),
      endDateTime: endDateTime.toISOString()
    };
  });
}

// =============================================================================
// Recurrence Info
// =============================================================================

/**
 * Gets a human-readable description of the recurrence pattern.
 *
 * @param event - The calendar event
 * @returns Description string
 *
 * @example
 * ```typescript
 * getRecurrenceDescription(event);
 * // "Chaque lundi" or "Le 15 de chaque mois"
 * ```
 */
export function getRecurrenceDescription(event: CalendarEvent): string {
  if (event.recurrence === EventRecurrence.NONE) {
    return 'Événement unique';
  }

  const startDate = new Date(event.startDateTime);
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  switch (event.recurrence) {
    case EventRecurrence.DAILY:
      return 'Chaque jour';

    case EventRecurrence.WEEKLY:
      return `Chaque ${dayNames[startDate.getDay()]}`;

    case EventRecurrence.MONTHLY:
      const dayOfMonth = startDate.getDate();
      return `Le ${dayOfMonth} de chaque mois`;

    case EventRecurrence.YEARLY:
      const day = startDate.getDate();
      const month = monthNames[startDate.getMonth()];
      return `Chaque année le ${day} ${month}`;

    default:
      return '';
  }
}

/**
 * Counts occurrences between two dates.
 *
 * @param event - The recurring event
 * @param rangeStart - Start of the date range
 * @param rangeEnd - End of the date range
 * @returns Number of occurrences
 */
export function countOccurrences(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): number {
  return generateOccurrences(event, rangeStart, rangeEnd).length;
}

/**
 * Checks if an event occurs on a specific date.
 *
 * @param event - The calendar event
 * @param date - The date to check
 * @returns True if the event occurs on this date
 */
export function occursOnDate(event: CalendarEvent, date: Date): boolean {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const occurrences = generateOccurrences(event, dayStart, dayEnd, 1);
  return occurrences.length > 0;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Adds a recurrence interval to a date.
 */
function addInterval(date: Date, recurrence: EventRecurrence): Date {
  switch (recurrence) {
    case EventRecurrence.DAILY:
      return addDays(date, 1);
    case EventRecurrence.WEEKLY:
      return addDays(date, 7);
    case EventRecurrence.MONTHLY:
      return addMonths(date, 1);
    case EventRecurrence.YEARLY:
      return addYears(date, 1);
    default:
      return date;
  }
}

/**
 * Gets the duration of an event in milliseconds.
 */
function getEventDuration(event: CalendarEvent): number {
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);
  return end.getTime() - start.getTime();
}

/**
 * Gets the number of days between recurrences.
 *
 * @param recurrence - The recurrence pattern
 * @returns Approximate number of days
 */
export function getRecurrenceIntervalDays(recurrence: EventRecurrence): number {
  switch (recurrence) {
    case EventRecurrence.DAILY:
      return 1;
    case EventRecurrence.WEEKLY:
      return 7;
    case EventRecurrence.MONTHLY:
      return 30; // Approximate
    case EventRecurrence.YEARLY:
      return 365; // Approximate
    default:
      return 0;
  }
}

/**
 * Determines if a recurrence pattern is compatible with a date range.
 *
 * @description
 * Useful for UI hints - e.g., daily recurrence for a 1-year range
 * would generate too many events.
 *
 * @param recurrence - The recurrence pattern
 * @param rangeStart - Start of the date range
 * @param rangeEnd - End of the date range
 * @param maxOccurrences - Maximum reasonable occurrences (default: 100)
 * @returns True if the pattern is reasonable for the range
 */
export function isRecurrenceReasonableForRange(
  recurrence: EventRecurrence,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number = 100
): boolean {
  if (recurrence === EventRecurrence.NONE) {
    return true;
  }

  const rangeDays = Math.ceil(
    (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const intervalDays = getRecurrenceIntervalDays(recurrence);
  const estimatedOccurrences = Math.ceil(rangeDays / intervalDays);

  return estimatedOccurrences <= maxOccurrences;
}
