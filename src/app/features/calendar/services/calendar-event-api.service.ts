import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CalendarEvent,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  DateRangeParams,
  CalendarEventStatus
} from '../models';

/**
 * Service for calendar event API operations.
 *
 * @description
 * Handles all HTTP communication with the calendar backend API.
 * All endpoints require authentication (handled by HTTP interceptor).
 *
 * Base URL: /api/calendar
 *
 * @example
 * ```typescript
 * export class CalendarComponent {
 *   private api = inject(CalendarEventApiService);
 *
 *   loadEvents(): void {
 *     this.api.getUserEvents().subscribe(events => {
 *       console.log('Loaded', events.length, 'events');
 *     });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarEventApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/calendar';

  // ===========================================================================
  // Create
  // ===========================================================================

  /**
   * Creates a new calendar event.
   *
   * @param request - Event creation payload
   * @returns Observable of the created event
   *
   * @example
   * ```typescript
   * const request: CreateCalendarEventRequest = {
   *   title: 'Team Meeting',
   *   startDateTime: '2025-02-10T14:00:00Z',
   *   endDateTime: '2025-02-10T15:00:00Z',
   *   allDay: false
   * };
   *
   * this.api.createEvent(request).subscribe(event => {
   *   console.log('Created event:', event.publicId);
   * });
   * ```
   */
  createEvent(request: CreateCalendarEventRequest): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(
      `${this.baseUrl}/events`,
      request
    );
  }

  // ===========================================================================
  // Read
  // ===========================================================================

  /**
   * Retrieves a single event by its public ID.
   *
   * @param publicId - Event public ID (UUID)
   * @returns Observable of the event
   * @throws 404 if event not found
   *
   * @example
   * ```typescript
   * this.api.getEvent('550e8400-e29b-41d4-a716-446655440000')
   *   .subscribe(event => console.log(event.title));
   * ```
   */
  getEvent(publicId: string): Observable<CalendarEvent> {
    return this.http.get<CalendarEvent>(
      `${this.baseUrl}/events/${publicId}`
    );
  }

  /**
   * Retrieves all events for the authenticated user.
   *
   * @returns Observable of event array
   *
   * @example
   * ```typescript
   * this.api.getUserEvents().subscribe(events => {
   *   this.events.set(events);
   * });
   * ```
   */
  getUserEvents(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(
      `${this.baseUrl}/events`
    );
  }

  /**
   * Retrieves events within a specific date range.
   *
   * @param params - Date range parameters (start, end in ISO format)
   * @returns Observable of event array
   *
   * @example
   * ```typescript
   * const params = QueryParamsUtils.forMonth(2025, 1); // February
   * this.api.getEventsInRange(params).subscribe(events => {
   *   console.log('Events in February:', events.length);
   * });
   * ```
   */
  getEventsInRange(params: DateRangeParams): Observable<CalendarEvent[]> {
    const httpParams = new HttpParams()
      .set('start', params.start)
      .set('end', params.end);

    return this.http.get<CalendarEvent[]>(
      `${this.baseUrl}/events/range`,
      { params: httpParams }
    );
  }

  /**
   * Retrieves upcoming events (from now onwards).
   *
   * @returns Observable of event array sorted by start date
   *
   * @example
   * ```typescript
   * this.api.getUpcomingEvents().subscribe(events => {
   *   this.upcomingEvents.set(events);
   * });
   * ```
   */
  getUpcomingEvents(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(
      `${this.baseUrl}/events/upcoming`
    );
  }

  /**
   * Retrieves events filtered by status.
   *
   * @param status - Event status to filter by
   * @returns Observable of event array
   *
   * @example
   * ```typescript
   * this.api.getEventsByStatus(CalendarEventStatus.CONFIRMED)
   *   .subscribe(events => console.log('Confirmed events:', events.length));
   * ```
   */
  getEventsByStatus(status: CalendarEventStatus): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(
      `${this.baseUrl}/events/status/${status}`
    );
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  /**
   * Updates an existing calendar event.
   *
   * @param publicId - Event public ID
   * @param request - Partial update payload (only provided fields are updated)
   * @returns Observable of the updated event
   * @throws 404 if event not found
   * @throws 403 if user doesn't own the event
   *
   * @example
   * ```typescript
   * this.api.updateEvent('550e8400...', { title: 'New Title' })
   *   .subscribe(updated => console.log('Updated:', updated.title));
   * ```
   */
  updateEvent(
    publicId: string,
    request: UpdateCalendarEventRequest
  ): Observable<CalendarEvent> {
    return this.http.put<CalendarEvent>(
      `${this.baseUrl}/events/${publicId}`,
      request
    );
  }

  /**
   * Cancels an event (sets status to CANCELLED).
   *
   * @param publicId - Event public ID
   * @returns Observable of the cancelled event
   *
   * @example
   * ```typescript
   * this.api.cancelEvent('550e8400...').subscribe(event => {
   *   console.log('Event cancelled:', event.status);
   * });
   * ```
   */
  cancelEvent(publicId: string): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(
      `${this.baseUrl}/events/${publicId}/cancel`,
      {}
    );
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  /**
   * Permanently deletes an event.
   *
   * @param publicId - Event public ID
   * @returns Observable that completes on success
   * @throws 404 if event not found
   * @throws 403 if user doesn't own the event
   *
   * @example
   * ```typescript
   * this.api.deleteEvent('550e8400...').subscribe(() => {
   *   console.log('Event deleted');
   * });
   * ```
   */
  deleteEvent(publicId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/events/${publicId}`
    );
  }
}
