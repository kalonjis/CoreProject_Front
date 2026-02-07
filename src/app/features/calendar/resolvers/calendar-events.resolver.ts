import { inject } from '@angular/core';
import {
  ResolveFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { Observable, of, catchError } from 'rxjs';

import { CalendarEventApiService } from '../services';
import { CalendarEvent, DateRangeParams, QueryParamsUtils } from '../models';

/**
 * Resolver that preloads a single calendar event.
 *
 * @description
 * Fetches event data before the route activates, ensuring the
 * component has data immediately available.
 *
 * Expects route parameter: `publicId`
 *
 * @example
 * ```typescript
 * // In routes configuration
 * {
 *   path: 'events/:publicId',
 *   component: EventDetailComponent,
 *   resolve: {
 *     event: calendarEventResolver
 *   }
 * }
 *
 * // In component
 * export class EventDetailComponent {
 *   private route = inject(ActivatedRoute);
 *   event = this.route.snapshot.data['event'] as CalendarEvent;
 * }
 * ```
 */
export const calendarEventResolver: ResolveFn<CalendarEvent | null> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<CalendarEvent | null> => {
  const api = inject(CalendarEventApiService);
  const publicId = route.paramMap.get('publicId');

  if (!publicId) {
    console.warn('calendarEventResolver: No publicId in route params');
    return of(null);
  }

  return api.getEvent(publicId).pipe(
    catchError(error => {
      console.error('calendarEventResolver: Failed to load event', error);
      return of(null);
    })
  );
};

/**
 * Resolver that preloads all user events.
 *
 * @description
 * Fetches all events for the current user before route activation.
 * Useful for the main calendar view.
 *
 * @example
 * ```typescript
 * // In routes configuration
 * {
 *   path: '',
 *   component: CalendarComponent,
 *   resolve: {
 *     events: calendarEventsResolver
 *   }
 * }
 * ```
 */
export const calendarEventsResolver: ResolveFn<CalendarEvent[]> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<CalendarEvent[]> => {
  const api = inject(CalendarEventApiService);

  return api.getUserEvents().pipe(
    catchError(error => {
      console.error('calendarEventsResolver: Failed to load events', error);
      return of([]);
    })
  );
};

/**
 * Resolver that preloads events for a specific month.
 *
 * @description
 * Fetches events within the month specified by query parameters.
 * Falls back to current month if no parameters provided.
 *
 * Query parameters: `year`, `month` (1-indexed)
 *
 * @example
 * ```typescript
 * // URL: /calendar?year=2025&month=2
 * {
 *   path: '',
 *   component: CalendarMonthViewComponent,
 *   resolve: {
 *     events: calendarMonthEventsResolver
 *   }
 * }
 * ```
 */
export const calendarMonthEventsResolver: ResolveFn<CalendarEvent[]> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<CalendarEvent[]> => {
  const api = inject(CalendarEventApiService);

  // Get year/month from query params or use current
  const now = new Date();
  const year = parseInt(route.queryParamMap.get('year') || '') || now.getFullYear();
  const month = parseInt(route.queryParamMap.get('month') || '') || (now.getMonth() + 1);

  // Create date range for the month (month is 1-indexed in URL, 0-indexed in JS)
  const params = QueryParamsUtils.forMonth(year, month - 1);

  return api.getEventsInRange(params).pipe(
    catchError(error => {
      console.error('calendarMonthEventsResolver: Failed to load events', error);
      return of([]);
    })
  );
};

/**
 * Resolver that preloads upcoming events.
 *
 * @description
 * Fetches upcoming events (starting from now) before route activation.
 * Useful for agenda or dashboard views.
 *
 * @example
 * ```typescript
 * {
 *   path: 'agenda',
 *   component: CalendarAgendaViewComponent,
 *   resolve: {
 *     events: calendarUpcomingEventsResolver
 *   }
 * }
 * ```
 */
export const calendarUpcomingEventsResolver: ResolveFn<CalendarEvent[]> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<CalendarEvent[]> => {
  const api = inject(CalendarEventApiService);

  return api.getUpcomingEvents().pipe(
    catchError(error => {
      console.error('calendarUpcomingEventsResolver: Failed to load events', error);
      return of([]);
    })
  );
};

/**
 * Resolver that preloads events for a date range from query params.
 *
 * @description
 * Fetches events within a date range specified by query parameters.
 *
 * Query parameters: `start`, `end` (ISO 8601 format)
 *
 * @example
 * ```typescript
 * // URL: /calendar/range?start=2025-02-01&end=2025-02-28
 * {
 *   path: 'range',
 *   component: CalendarRangeViewComponent,
 *   resolve: {
 *     events: calendarRangeEventsResolver
 *   }
 * }
 * ```
 */
export const calendarRangeEventsResolver: ResolveFn<CalendarEvent[]> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<CalendarEvent[]> => {
  const api = inject(CalendarEventApiService);

  const start = route.queryParamMap.get('start');
  const end = route.queryParamMap.get('end');

  if (!start || !end) {
    console.warn('calendarRangeEventsResolver: Missing start or end query params');
    return of([]);
  }

  const params: DateRangeParams = {
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString()
  };

  return api.getEventsInRange(params).pipe(
    catchError(error => {
      console.error('calendarRangeEventsResolver: Failed to load events', error);
      return of([]);
    })
  );
};

/**
 * Factory to create a resolver with custom error handling.
 *
 * @param options - Resolver configuration
 * @returns Configured ResolveFn
 *
 * @example
 * ```typescript
 * export const customEventResolver = createEventResolver({
 *   onError: (error) => {
 *     const toast = inject(ToastService);
 *     toast.error('Impossible de charger l\'événement');
 *     return null;
 *   },
 *   redirectOnError: '/calendar'
 * });
 * ```
 */
export function createEventResolver(options: {
  onError?: (error: unknown) => CalendarEvent | null;
  redirectOnError?: string;
}): ResolveFn<CalendarEvent | null> {
  return (route, state) => {
    const api = inject(CalendarEventApiService);
    const publicId = route.paramMap.get('publicId');

    if (!publicId) {
      return of(null);
    }

    return api.getEvent(publicId).pipe(
      catchError(error => {
        if (options.onError) {
          return of(options.onError(error));
        }
        return of(null);
      })
    );
  };
}
