/**
 * Pure utility functions for date manipulation.
 *
 * @description
 * Stateless helper functions for common date operations in the calendar.
 * These are pure functions with no dependencies on Angular services.
 *
 * For service-based date operations with DI, use CalendarDateService.
 *
 * @example
 * ```typescript
 * import {
 *   getMonthGrid,
 *   getWeekNumber,
 *   isSameDay
 * } from '@features/calendar/utils';
 *
 * const grid = getMonthGrid(2025, 1); // February 2025
 * const weekNum = getWeekNumber(new Date());
 * ```
 */

// =============================================================================
// Month Grid Generation
// =============================================================================

/**
 * Generates a complete month grid including padding days from adjacent months.
 *
 * @description
 * Creates a 6x7 grid (42 days) for calendar month view, including
 * leading days from the previous month and trailing days from the next month.
 *
 * @param year - The year
 * @param month - The month (0-indexed, 0 = January)
 * @param startOnMonday - Whether the week starts on Monday (default: true)
 * @returns Array of Date objects representing the grid
 *
 * @example
 * ```typescript
 * const grid = getMonthGrid(2025, 1); // February 2025
 * // Returns 42 dates starting from the Monday before Feb 1
 * ```
 */
export function getMonthGrid(
  year: number,
  month: number,
  startOnMonday: boolean = true
): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Calculate the start of the grid
  let startOffset = firstDay.getDay();
  if (startOnMonday) {
    startOffset = startOffset === 0 ? 6 : startOffset - 1;
  }

  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - startOffset);

  // Generate 42 days (6 weeks)
  const grid: Date[] = [];
  const current = new Date(gridStart);

  for (let i = 0; i < 42; i++) {
    grid.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return grid;
}

/**
 * Generates an array of week day names.
 *
 * @param startOnMonday - Whether to start on Monday (default: true)
 * @param format - 'short' (Mon) or 'narrow' (M) or 'long' (Monday)
 * @param locale - Locale string (default: 'fr-BE')
 * @returns Array of day name strings
 *
 * @example
 * ```typescript
 * getWeekDayNames();
 * // ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']
 * ```
 */
export function getWeekDayNames(
  startOnMonday: boolean = true,
  format: 'short' | 'narrow' | 'long' = 'short',
  locale: string = 'fr-BE'
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
  const days: string[] = [];

  // Start from a known Sunday (Jan 4, 1970)
  const baseDate = new Date(1970, 0, 4);

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    days.push(formatter.format(date));
  }

  if (startOnMonday) {
    // Move Sunday to the end
    const sunday = days.shift()!;
    days.push(sunday);
  }

  return days;
}

/**
 * Gets the month names for a given locale.
 *
 * @param format - 'short' (Jan) or 'long' (January)
 * @param locale - Locale string (default: 'fr-BE')
 * @returns Array of month name strings
 */
export function getMonthNames(
  format: 'short' | 'long' = 'long',
  locale: string = 'fr-BE'
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: format });
  const months: string[] = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(2025, i, 1);
    months.push(formatter.format(date));
  }

  return months;
}

// =============================================================================
// Week Number
// =============================================================================

/**
 * Calculates the ISO week number for a given date.
 *
 * @param date - The date to calculate week number for
 * @returns ISO week number (1-53)
 *
 * @example
 * ```typescript
 * getWeekNumber(new Date('2025-02-10'));
 * // Returns: 7
 * ```
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Gets all weeks in a month with their week numbers.
 *
 * @param year - The year
 * @param month - The month (0-indexed)
 * @returns Array of { weekNumber, days } objects
 */
export function getWeeksInMonth(
  year: number,
  month: number
): Array<{ weekNumber: number; days: Date[] }> {
  const grid = getMonthGrid(year, month);
  const weeks: Array<{ weekNumber: number; days: Date[] }> = [];

  for (let i = 0; i < 6; i++) {
    const weekDays = grid.slice(i * 7, (i + 1) * 7);
    const weekNumber = getWeekNumber(weekDays[3]); // Thursday determines week number
    weeks.push({ weekNumber, days: weekDays });
  }

  return weeks;
}

// =============================================================================
// Date Comparisons
// =============================================================================

/**
 * Checks if two dates are on the same day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Checks if two dates are in the same month.
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

/**
 * Checks if a date is today.
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Checks if a date is in the current month.
 */
export function isCurrentMonth(date: Date): boolean {
  return isSameMonth(date, new Date());
}

/**
 * Checks if a date is a weekend (Saturday or Sunday).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// =============================================================================
// Time Slots Generation
// =============================================================================

/**
 * Generates time slots for a day view.
 *
 * @param startHour - Starting hour (0-23, default: 0)
 * @param endHour - Ending hour (0-24, default: 24)
 * @param intervalMinutes - Interval in minutes (default: 60)
 * @returns Array of time slot strings (HH:mm format)
 *
 * @example
 * ```typescript
 * getTimeSlots(8, 18, 30);
 * // ['08:00', '08:30', '09:00', ..., '17:30']
 * ```
 */
export function getTimeSlots(
  startHour: number = 0,
  endHour: number = 24,
  intervalMinutes: number = 60
): string[] {
  const slots: string[] = [];
  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    );
    currentMinutes += intervalMinutes;
  }

  return slots;
}

/**
 * Converts a time string to minutes from midnight.
 *
 * @example
 * ```typescript
 * timeToMinutes('14:30'); // 870
 * ```
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to time string.
 *
 * @example
 * ```typescript
 * minutesToTime(870); // '14:30'
 * ```
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// =============================================================================
// Date Arithmetic
// =============================================================================

/**
 * Adds days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds months to a date.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Adds years to a date.
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Gets the number of days in a month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
