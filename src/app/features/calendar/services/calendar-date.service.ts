import { Injectable } from '@angular/core';

/**
 * Service for date manipulation and timezone handling.
 *
 * @description
 * Provides utility methods for working with dates in the calendar context.
 * All API communications use UTC (ISO 8601 strings), while the UI displays
 * dates in the user's local timezone.
 *
 * Key responsibilities:
 * - Convert between UTC and local timezone
 * - Format dates for display
 * - Calculate date ranges for views
 * - Parse and combine date/time inputs
 *
 * @example
 * ```typescript
 * export class EventFormComponent {
 *   private dateService = inject(CalendarDateService);
 *
 *   onSubmit(): void {
 *     const isoStart = this.dateService.combineDateTime(
 *       this.form.startDate,
 *       this.form.startTime
 *     );
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarDateService {
  // ===========================================================================
  // Timezone Conversion
  // ===========================================================================

  /**
   * Converts a UTC ISO string to a local Date object.
   *
   * @param isoString - UTC date string in ISO 8601 format
   * @returns Local Date object
   *
   * @example
   * ```typescript
   * const local = dateService.utcToLocal('2025-02-10T14:00:00Z');
   * // In Brussels (UTC+1): Mon Feb 10 2025 15:00:00
   * ```
   */
  utcToLocal(isoString: string): Date {
    return new Date(isoString);
  }

  /**
   * Converts a local Date object to a UTC ISO string.
   *
   * @param date - Local Date object
   * @returns UTC date string in ISO 8601 format
   *
   * @example
   * ```typescript
   * const utc = dateService.localToUtc(new Date(2025, 1, 10, 15, 0));
   * // In Brussels (UTC+1): '2025-02-10T14:00:00.000Z'
   * ```
   */
  localToUtc(date: Date): string {
    return date.toISOString();
  }

  /**
   * Combines a date and time string into a UTC ISO string.
   *
   * @param date - Date object (only date part is used)
   * @param time - Time string in HH:mm format
   * @returns UTC date string in ISO 8601 format
   *
   * @example
   * ```typescript
   * const iso = dateService.combineDateTime(
   *   new Date(2025, 1, 10),
   *   '14:30'
   * );
   * ```
   */
  combineDateTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
  }

  /**
   * Extracts the time string (HH:mm) from an ISO date string.
   *
   * @param isoString - UTC date string in ISO 8601 format
   * @returns Time string in HH:mm format (local timezone)
   *
   * @example
   * ```typescript
   * const time = dateService.extractTime('2025-02-10T14:00:00Z');
   * // In Brussels: '15:00'
   * ```
   */
  extractTime(isoString: string): string {
    const date = new Date(isoString);
    return this.formatTime(date);
  }

  /**
   * Extracts the date part from an ISO string as a Date object.
   *
   * @param isoString - UTC date string in ISO 8601 format
   * @returns Date object with time set to midnight local
   *
   * @example
   * ```typescript
   * const date = dateService.extractDate('2025-02-10T14:00:00Z');
   * ```
   */
  extractDate(isoString: string): Date {
    const date = new Date(isoString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // ===========================================================================
  // Formatting
  // ===========================================================================

  /**
   * Formats a date for display (localized).
   *
   * @param date - Date to format
   * @param options - Intl.DateTimeFormat options
   * @returns Formatted date string
   *
   * @example
   * ```typescript
   * dateService.formatDate(new Date(), { dateStyle: 'long' });
   * // '10 février 2025'
   * ```
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    return new Intl.DateTimeFormat('fr-BE', defaultOptions).format(date);
  }

  /**
   * Formats a time for display (HH:mm).
   *
   * @param date - Date to extract time from
   * @returns Formatted time string
   *
   * @example
   * ```typescript
   * dateService.formatTime(new Date());
   * // '14:30'
   * ```
   */
  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-BE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Formats a date and time for display.
   *
   * @param date - Date to format
   * @returns Formatted datetime string
   *
   * @example
   * ```typescript
   * dateService.formatDateTime(new Date());
   * // '10 février 2025 à 14:30'
   * ```
   */
  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-BE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Formats a date range for display.
   *
   * @param start - Start date
   * @param end - End date
   * @param allDay - Whether this is an all-day event
   * @returns Formatted range string
   *
   * @example
   * ```typescript
   * dateService.formatDateRange(start, end, false);
   * // '10 février 2025, 14:00 - 15:00'
   * // or '10 - 12 février 2025' for multi-day
   * ```
   */
  formatDateRange(start: Date, end: Date, allDay: boolean): string {
    const sameDay = this.isSameDay(start, end);

    if (allDay) {
      if (sameDay) {
        return this.formatDate(start);
      }
      return `${this.formatDate(start, { day: 'numeric', month: 'long' })} - ${this.formatDate(end)}`;
    }

    if (sameDay) {
      return `${this.formatDate(start)}, ${this.formatTime(start)} - ${this.formatTime(end)}`;
    }

    return `${this.formatDateTime(start)} - ${this.formatDateTime(end)}`;
  }

  /**
   * Formats a relative date (e.g., "Today", "Tomorrow", "In 3 days").
   *
   * @param date - Date to format
   * @returns Relative date string
   *
   * @example
   * ```typescript
   * dateService.formatRelative(tomorrow);
   * // 'Demain'
   * ```
   */
  formatRelative(date: Date): string {
    const now = new Date();
    const diff = this.daysDiff(now, date);

    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    if (diff === -1) return 'Hier';
    if (diff > 1 && diff <= 7) return `Dans ${diff} jours`;
    if (diff < -1 && diff >= -7) return `Il y a ${Math.abs(diff)} jours`;

    return this.formatDate(date);
  }

  // ===========================================================================
  // Date Calculations
  // ===========================================================================

  /**
   * Gets the start of a day (midnight).
   */
  startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Gets the end of a day (23:59:59.999).
   */
  endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Gets the start of a week (Monday).
   */
  startOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Gets the end of a week (Sunday).
   */
  endOfWeek(date: Date): Date {
    const start = this.startOfWeek(date);
    const result = new Date(start);
    result.setDate(result.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Gets the start of a month.
   */
  startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  /**
   * Gets the end of a month.
   */
  endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  /**
   * Gets all days in a month (for month view grid).
   */
  getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    return days;
  }

  /**
   * Gets the week days for a given date.
   */
  getWeekDays(date: Date): Date[] {
    const start = this.startOfWeek(date);
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }

    return days;
  }

  // ===========================================================================
  // Comparisons
  // ===========================================================================

  /**
   * Checks if two dates are on the same day.
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Checks if a date is today.
   */
  isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  /**
   * Checks if a date is in the past.
   */
  isPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Checks if a date is in the future.
   */
  isFuture(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Calculates the difference in days between two dates.
   */
  daysDiff(date1: Date, date2: Date): number {
    const d1 = this.startOfDay(date1).getTime();
    const d2 = this.startOfDay(date2).getTime();
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculates the duration in minutes between two dates.
   */
  durationInMinutes(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Formats a duration in minutes as a human-readable string.
   *
   * @example
   * ```typescript
   * dateService.formatDuration(90);
   * // '1h 30min'
   * ```
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}
