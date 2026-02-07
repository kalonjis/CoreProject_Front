import { CalendarEventStatus } from './calendar-event-status.enum';

/**
 * Query parameters for fetching events within a date range.
 *
 * Used with endpoint: GET /api/calendar/events/range
 *
 * @description
 * Both start and end dates are required for range queries.
 * Dates should be in ISO 8601 format (UTC).
 *
 * @example
 * ```typescript
 * const params: DateRangeParams = {
 *   start: '2025-02-01T00:00:00Z',
 *   end: '2025-02-28T23:59:59Z'
 * };
 *
 * // Usage with HttpClient
 * http.get('/api/calendar/events/range', { params });
 * ```
 */
export interface DateRangeParams {
  /** Start of the date range in ISO 8601 format (inclusive) */
  start: string;

  /** End of the date range in ISO 8601 format (inclusive) */
  end: string;
}

/**
 * Query parameters for filtering events by status.
 *
 * Used with endpoint: GET /api/calendar/events/status/{status}
 *
 * @example
 * ```typescript
 * const params: StatusFilterParams = {
 *   status: CalendarEventStatus.CONFIRMED
 * };
 * ```
 */
export interface StatusFilterParams {
  /** Event status to filter by */
  status: CalendarEventStatus;
}

/**
 * Combined query parameters for advanced event filtering.
 *
 * @description
 * All parameters are optional. Combine them as needed for flexible filtering.
 * The backend will apply AND logic for multiple filters.
 *
 * @example
 * ```typescript
 * const params: EventQueryParams = {
 *   start: '2025-02-01T00:00:00Z',
 *   end: '2025-02-28T23:59:59Z',
 *   status: CalendarEventStatus.CONFIRMED
 * };
 * ```
 */
export interface EventQueryParams {
  /** Start of the date range in ISO 8601 format */
  start?: string;

  /** End of the date range in ISO 8601 format */
  end?: string;

  /** Filter by event status */
  status?: CalendarEventStatus;
}

/**
 * Utility functions for building query parameters.
 */
export const QueryParamsUtils = {
  /**
   * Creates date range params for a specific month.
   *
   * @param year - The year
   * @param month - The month (0-indexed, 0 = January)
   * @returns DateRangeParams covering the entire month
   *
   * @example
   * ```typescript
   * const params = QueryParamsUtils.forMonth(2025, 1); // February 2025
   * // { start: '2025-02-01T00:00:00.000Z', end: '2025-02-28T23:59:59.999Z' }
   * ```
   */
  forMonth: (year: number, month: number): DateRangeParams => {
    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  },

  /**
   * Creates date range params for a specific week.
   *
   * @param date - Any date within the desired week
   * @param startOnMonday - Whether week starts on Monday (default: true)
   * @returns DateRangeParams covering the entire week
   *
   * @example
   * ```typescript
   * const params = QueryParamsUtils.forWeek(new Date('2025-02-10'));
   * ```
   */
  forWeek: (date: Date, startOnMonday: boolean = true): DateRangeParams => {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = startOnMonday
      ? (day === 0 ? -6 : 1 - day)
      : -day;

    const start = new Date(d);
    start.setUTCDate(d.getUTCDate() + diff);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  },

  /**
   * Creates date range params for a specific day.
   *
   * @param date - The target date
   * @returns DateRangeParams covering the entire day
   *
   * @example
   * ```typescript
   * const params = QueryParamsUtils.forDay(new Date('2025-02-10'));
   * ```
   */
  forDay: (date: Date): DateRangeParams => {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }
};
