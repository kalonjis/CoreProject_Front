import { Injectable, inject, computed, signal } from '@angular/core';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { CalendarEventApiService } from './calendar-event-api.service';
import {
  CalendarEvent,
  CalendarView,
  CalendarFilterState,
  CalendarEventStatus,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  DateRangeParams,
  DEFAULT_CALENDAR_FILTER_STATE,
  CALENDAR_FILTER_UTILS,
  CalendarEventStatusUtils
} from '../models';
import {FeedbackService} from '../../../shared/feedback/tools/feedback.service';

/**
 * State management service for calendar events using Angular signals.
 *
 * @description
 * Centralized reactive state for calendar data. Uses Angular signals
 * for fine-grained reactivity and automatic change detection.
 *
 * Features:
 * - Events loading and caching
 * - Current view and date tracking
 * - Client-side filtering
 * - Loading and error states
 * - Selected event management
 *
 * @example
 * ```typescript
 * export class CalendarComponent {
 *   private state = inject(CalendarEventStateService);
 *
 *   // Reactive bindings
 *   events = this.state.filteredEvents;
 *   loading = this.state.loading;
 *   currentView = this.state.currentView;
 *
 *   ngOnInit(): void {
 *     this.state.loadEventsForCurrentView();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarEventStateService {
  private readonly api = inject(CalendarEventApiService);
  private feedback = inject(FeedbackService);

  // ===========================================================================
  // Core State Signals
  // ===========================================================================

  /** All loaded events */
  private readonly _events = signal<CalendarEvent[]>([]);

  /** Currently selected event (for detail view/editing) */
  private readonly _selectedEvent = signal<CalendarEvent | null>(null);

  /** Current calendar view mode */
  private readonly _currentView = signal<CalendarView>(CalendarView.MONTH);

  /** Currently displayed date (center of the view) */
  private readonly _currentDate = signal<Date>(new Date());

  /** Active filters */
  private readonly _filters = signal<CalendarFilterState>(DEFAULT_CALENDAR_FILTER_STATE);

  /** Loading state */
  private readonly _loading = signal<boolean>(false);

  /** Error state */
  private readonly _error = signal<string | null>(null);

  // ===========================================================================
  // Public Readonly Signals
  // ===========================================================================

  /** All loaded events (readonly) */
  readonly events = this._events.asReadonly();

  /** Currently selected event (readonly) */
  readonly selectedEvent = this._selectedEvent.asReadonly();

  /** Current calendar view mode (readonly) */
  readonly currentView = this._currentView.asReadonly();

  /** Currently displayed date (readonly) */
  readonly currentDate = this._currentDate.asReadonly();

  /** Active filters (readonly) */
  readonly filters = this._filters.asReadonly();

  /** Loading state (readonly) */
  readonly loading = this._loading.asReadonly();

  /** Error state (readonly) */
  readonly error = this._error.asReadonly();

  // ===========================================================================
  // Computed Signals
  // ===========================================================================

  /**
   * Events filtered by current filter state.
   * Applies client-side filtering to loaded events.
   */
  readonly filteredEvents = computed(() => {
    const events = this._events();
    const filters = this._filters();

    return events.filter(event => this.matchesFilters(event, filters));
  });

  /**
   * Count of filtered events.
   */
  readonly filteredEventsCount = computed(() => this.filteredEvents().length);

  /**
   * Count of total loaded events.
   */
  readonly totalEventsCount = computed(() => this._events().length);

  /**
   * Whether any filters are currently active.
   */
  readonly hasActiveFilters = computed(() =>
    CALENDAR_FILTER_UTILS.hasActiveFilters(this._filters())
  );

  /**
   * Events grouped by date (for agenda view).
   */
  readonly eventsByDate = computed(() => {
    const events = this.filteredEvents();
    const grouped = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const dateKey = event.startDateTime.split('T')[0];
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, event]);
    }

    return grouped;
  });

  /**
   * Upcoming events (not cancelled, starting from now).
   */
  readonly upcomingEvents = computed(() => {
    const now = new Date().toISOString();
    return this.filteredEvents()
      .filter(e =>
        e.startDateTime >= now &&
        !CalendarEventStatusUtils.isCancelled(e.status)
      )
      .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  });

  // ===========================================================================
  // View & Navigation Actions
  // ===========================================================================

  /**
   * Sets the current calendar view.
   */
  setView(view: CalendarView): void {
    this._currentView.set(view);
  }

  /**
   * Sets the current displayed date.
   */
  setCurrentDate(date: Date): void {
    this._currentDate.set(date);
  }

  /**
   * Navigates to today's date.
   */
  goToToday(): void {
    this._currentDate.set(new Date());
  }

  /**
   * Navigates to the previous period (day/week/month based on current view).
   */
  goToPrevious(): void {
    const current = this._currentDate();
    const view = this._currentView();
    const newDate = new Date(current);

    switch (view) {
      case CalendarView.DAY:
        newDate.setDate(newDate.getDate() - 1);
        break;
      case CalendarView.WEEK:
        newDate.setDate(newDate.getDate() - 7);
        break;
      case CalendarView.MONTH:
      case CalendarView.AGENDA:
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    this._currentDate.set(newDate);
  }

  /**
   * Navigates to the next period (day/week/month based on current view).
   */
  goToNext(): void {
    const current = this._currentDate();
    const view = this._currentView();
    const newDate = new Date(current);

    switch (view) {
      case CalendarView.DAY:
        newDate.setDate(newDate.getDate() + 1);
        break;
      case CalendarView.WEEK:
        newDate.setDate(newDate.getDate() + 7);
        break;
      case CalendarView.MONTH:
      case CalendarView.AGENDA:
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    this._currentDate.set(newDate);
  }

  // ===========================================================================
  // Filter Actions
  // ===========================================================================

  /**
   * Updates the filter state.
   */
  setFilters(filters: Partial<CalendarFilterState>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  /**
   * Resets all filters to default.
   */
  resetFilters(): void {
    this._filters.set(DEFAULT_CALENDAR_FILTER_STATE);
  }

  /**
   * Toggles a status filter.
   */
  toggleStatusFilter(status: CalendarEventStatus): void {
    this._filters.update(current => {
      const statuses = current.statuses.includes(status)
        ? current.statuses.filter(s => s !== status)
        : [...current.statuses, status];
      return { ...current, statuses };
    });
  }

  // ===========================================================================
  // Event Selection
  // ===========================================================================

  /**
   * Selects an event for viewing/editing.
   */
  selectEvent(event: CalendarEvent | null): void {
    this._selectedEvent.set(event);
  }

  /**
   * Selects an event by its public ID.
   */
  selectEventById(publicId: string): void {
    const event = this._events().find(e => e.publicId === publicId) || null;
    this._selectedEvent.set(event);
  }

  /**
   * Clears the selected event.
   */
  clearSelection(): void {
    this._selectedEvent.set(null);
  }

  // ===========================================================================
  // Data Loading Actions
  // ===========================================================================

  /**
   * Loads all events for the current user.
   */
  loadAllEvents(): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.getUserEvents()
      .pipe(
        tap(events => this._events.set(events)),
        catchError(err => {
          this._error.set(err.message || 'Failed to load events');
          return EMPTY;
        }),
        finalize(() => this._loading.set(false))
      )
      .subscribe();
  }

  /**
   * Loads events for a specific date range.
   */
  loadEventsInRange(params: DateRangeParams): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.getEventsInRange(params)
      .pipe(
        tap(events => this._events.set(events)),
        catchError(err => {
          this._error.set(err.message || 'Failed to load events');
          return EMPTY;
        }),
        finalize(() => this._loading.set(false))
      )
      .subscribe();
  }

  /**
   * Loads upcoming events only.
   */
  loadUpcomingEvents(): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.getUpcomingEvents()
      .pipe(
        tap(events => this._events.set(events)),
        catchError(err => {
          this._error.set(err.message || 'Failed to load events');
          return EMPTY;
        }),
        finalize(() => this._loading.set(false))
      )
      .subscribe();
  }

  // ===========================================================================
  // CRUD Actions
  // ===========================================================================

  /**
   * Creates a new event and adds it to the state.
   */
  createEvent(request: CreateCalendarEventRequest): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.createEvent(request)
      .pipe(
        tap(created => {
          this._events.update(events => [...events, created]);
          this.feedback.showSuccess('Événement créé avec succès');
        }),
        catchError(err => {
          this._error.set(err.message || 'Failed to create event');
          this.feedback.showError('Erreur lors de la création de l\'événement');
          return EMPTY;
        }),
        finalize(() => this._loading.set(false))
      )
      .subscribe();
  }

  /**
   * Updates an event and refreshes it in the state.
   */
  updateEvent(publicId: string, request: UpdateCalendarEventRequest): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.updateEvent(publicId, request)
      .pipe(
        tap(updated => {
          this._events.update(events =>
            events.map(e => e.publicId === publicId ? updated : e)
          );
          if (this._selectedEvent()?.publicId === publicId) {
            this._selectedEvent.set(updated);
          }
          this.feedback.showSuccess('Événement modifié avec succès');
        }),
        catchError(err => {
          this._error.set(err.message || 'Failed to update event');
          this.feedback.showError('Erreur lors de la modification');
          return EMPTY;
        }),
        finalize(() => this._loading.set(false))
      )
      .subscribe();
  }

  /**
   * Cancels an event.
   */
  cancelEvent(publicId: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.cancelEvent(publicId)
      .pipe(
        tap(cancelled => {
          this._events.update(events =>
            events.map(e => e.publicId === publicId ? cancelled : e)
          );
          if (this._selectedEvent()?.publicId === publicId) {
            this._selectedEvent.set(cancelled);
          }
          this.feedback.showSuccess('Événement annulé avec succès');
        }),
        catchError(err => {
          this._error.set(err.message || 'Failed to cancel event');
          this.feedback.showError("Erreur lors de l'annulation");
          return EMPTY;
        }),
        finalize(() => this._loading.set(false))
      )
      .subscribe();
  }

  /**
   * Deletes an event and removes it from the state.
   */
  deleteEvent(publicId: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.deleteEvent(publicId)
      .pipe(
        tap(() => {
          this._events.update(events =>
            events.filter(e => e.publicId !== publicId)
          );
          if (this._selectedEvent()?.publicId === publicId) {
            this._selectedEvent.set(null);
          }
          this.feedback.showSuccess('Événement supprimé avec succès');
        }),
        catchError(err => {
          this._error.set(err.message || 'Failed to delete event');
          this.feedback.showError('Erreur lors de la suppression');
          return EMPTY;
        }),
        finalize(() => this._loading.set(false))
      )
      .subscribe();
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Checks if an event matches the current filters.
   */
  private matchesFilters(event: CalendarEvent, filters: CalendarFilterState): boolean {
    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(event.status)) {
      return false;
    }

    // Show cancelled filter
    if (!filters.showCancelled && CalendarEventStatusUtils.isCancelled(event.status)) {
      return false;
    }

    // Recurrence filter
    if (filters.recurrences.length > 0 && !filters.recurrences.includes(event.recurrence)) {
      return false;
    }

    // Color filter
    if (filters.colorCodes.length > 0 && event.colorCode && !filters.colorCodes.includes(event.colorCode)) {
      return false;
    }

    // Search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = event.title.toLowerCase().includes(query);
      const matchesDesc = event.description?.toLowerCase().includes(query) || false;
      const matchesLocation = event.location?.toLowerCase().includes(query) || false;

      if (!matchesTitle && !matchesDesc && !matchesLocation) {
        return false;
      }
    }

    return true;
  }
}
