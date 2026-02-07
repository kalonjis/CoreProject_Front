import {
  Component,
  OnInit,
  inject,
  computed,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';

import { CalendarEventStateService } from '../services';
import {
  CalendarEvent,
  CalendarView,
  CalendarFilterState,
  QueryParamsUtils
} from '../models';
import { CALENDAR_CONFIG, CalendarConfig } from '../calendar.config';

import { CalendarHeaderComponent } from '../components/calendar-header/calendar-header.component';
import { CalendarFiltersComponent } from '../components/calendar-filters/calendar-filters.component';
import { CalendarViewSwitcherComponent } from '../components/calendar-view-switcher/calendar-view-switcher.component';
import { CalendarMiniMonthComponent } from '../components/calendar-mini-month/calendar-mini-month.component';
import { CalendarEventDetailComponent } from '../components/calendar-event-detail/calendar-event-detail.component';

/**
 * Main calendar page component (Smart Container).
 *
 * @description
 * This is the top-level container for the calendar feature.
 * It orchestrates the interaction between child components and manages
 * the overall calendar state.
 *
 * Responsibilities:
 * - Coordinates state between header, filters, and view components
 * - Handles navigation between views
 * - Manages the selected event sidebar/modal
 * - Loads data based on current view and date range
 *
 * @example
 * ```typescript
 * // Route configuration
 * {
 *   path: 'calendar',
 *   component: CalendarComponent,
 *   children: [
 *     { path: 'month', component: CalendarMonthViewComponent },
 *     { path: 'week', component: CalendarWeekViewComponent },
 *     // ...
 *   ]
 * }
 * ```
 */
@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    CalendarHeaderComponent,
    CalendarFiltersComponent,
    CalendarViewSwitcherComponent,
    CalendarMiniMonthComponent,
    CalendarEventDetailComponent
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly config = inject(CALENDAR_CONFIG);
  protected readonly state = inject(CalendarEventStateService);

  // ===========================================================================
  // Local State
  // ===========================================================================

  /** Whether the sidebar is visible (for mini calendar and filters) */
  readonly sidebarOpen = signal<boolean>(true);

  /** Whether the event detail panel is visible */
  readonly detailPanelOpen = signal<boolean>(false);

  /** Whether filters panel is expanded on mobile */
  readonly filtersExpanded = signal<boolean>(false);

  // ===========================================================================
  // Computed State (from service)
  // ===========================================================================

  readonly currentView = this.state.currentView;
  readonly currentDate = this.state.currentDate;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly selectedEvent = this.state.selectedEvent;
  readonly filteredEvents = this.state.filteredEvents;
  readonly hasActiveFilters = this.state.hasActiveFilters;

  /** Title for the current view (e.g., "Février 2025") */
  readonly viewTitle = computed(() => {
    const date = this.currentDate();
    const view = this.currentView();

    const formatter = new Intl.DateTimeFormat(this.config.locale, {
      month: 'long',
      year: 'numeric'
    });

    switch (view) {
      case CalendarView.DAY:
        return new Intl.DateTimeFormat(this.config.locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(date);

      case CalendarView.WEEK:
        const weekStart = this.getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.getDate()} - ${weekEnd.getDate()} ${formatter.format(weekEnd)}`;
        }
        return `${weekStart.getDate()} ${new Intl.DateTimeFormat(this.config.locale, { month: 'short' }).format(weekStart)} - ${weekEnd.getDate()} ${new Intl.DateTimeFormat(this.config.locale, { month: 'short', year: 'numeric' }).format(weekEnd)}`;

      case CalendarView.MONTH:
      case CalendarView.AGENDA:
      default:
        return formatter.format(date);
    }
  });

  // ===========================================================================
  // Effects
  // ===========================================================================

  constructor() {
    // Sync view changes with router
    effect(() => {
      const view = this.currentView();
      const viewPath = view.toLowerCase();
      this.router.navigate([viewPath], { relativeTo: this.route });
    });

    // Load events when date changes
    effect(() => {
      const date = this.currentDate();
      const view = this.currentView();
      this.loadEventsForView(date, view);
    });

    // Open detail panel when event is selected
    effect(() => {
      const event = this.selectedEvent();
      this.detailPanelOpen.set(!!event);
    });
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  ngOnInit(): void {
    // Set initial view from config or route
    const routeView = this.route.firstChild?.snapshot.url[0]?.path;
    if (routeView) {
      const view = this.parseViewFromRoute(routeView);
      if (view) {
        this.state.setView(view);
      }
    } else {
      this.state.setView(this.config.defaultView);
    }

    // Initial data load
    this.state.loadAllEvents();
  }

  // ===========================================================================
  // Navigation Actions
  // ===========================================================================

  /**
   * Handles view change from header or view switcher.
   */
  onViewChange(view: CalendarView): void {
    this.state.setView(view);
  }

  /**
   * Handles date selection from mini calendar or navigation.
   */
  onDateSelect(date: Date): void {
    this.state.setCurrentDate(date);
  }

  /**
   * Navigates to today.
   */
  onTodayClick(): void {
    this.state.goToToday();
  }

  /**
   * Navigates to previous period.
   */
  onPreviousClick(): void {
    this.state.goToPrevious();
  }

  /**
   * Navigates to next period.
   */
  onNextClick(): void {
    this.state.goToNext();
  }

  // ===========================================================================
  // Event Actions
  // ===========================================================================

  /**
   * Handles event selection from calendar views.
   */
  onEventSelect(event: CalendarEvent): void {
    this.state.selectEvent(event);
  }

  /**
   * Handles click on empty time slot (create new event).
   */
  onSlotClick(date: Date): void {
    this.router.navigate(['events', 'new'], {
      relativeTo: this.route.parent,
      queryParams: {
        date: date.toISOString()
      }
    });
  }

  /**
   * Opens the event creation form.
   */
  onCreateEvent(): void {
    this.router.navigate(['events', 'new'], {
      relativeTo: this.route.parent
    });
  }

  /**
   * Closes the event detail panel.
   */
  onDetailClose(): void {
    this.state.clearSelection();
    this.detailPanelOpen.set(false);
  }

  /**
   * Navigates to edit the selected event.
   */
  onEditEvent(event: CalendarEvent): void {
    this.router.navigate(['events', event.publicId, 'edit'], {
      relativeTo: this.route.parent
    });
  }

  /**
   * Deletes the selected event.
   */
  onDeleteEvent(event: CalendarEvent): void {
    if (confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      this.state.deleteEvent(event.publicId);
    }
  }

  // ===========================================================================
  // Filter Actions
  // ===========================================================================

  /**
   * Handles filter changes.
   */
  onFiltersChange(filters: Partial<CalendarFilterState>): void {
    this.state.setFilters(filters);
  }

  /**
   * Resets all filters.
   */
  onFiltersReset(): void {
    this.state.resetFilters();
  }

  // ===========================================================================
  // UI Actions
  // ===========================================================================

  /**
   * Toggles the sidebar visibility.
   */
  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  /**
   * Toggles the filters panel on mobile.
   */
  toggleFilters(): void {
    this.filtersExpanded.update(expanded => !expanded);
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * Loads events appropriate for the current view and date.
   */
  private loadEventsForView(date: Date, view: CalendarView): void {
    let params;

    switch (view) {
      case CalendarView.DAY:
        params = QueryParamsUtils.forDay(date);
        break;
      case CalendarView.WEEK:
        params = QueryParamsUtils.forWeek(date, this.config.weekStartsOnMonday);
        break;
      case CalendarView.MONTH:
        params = QueryParamsUtils.forMonth(date.getFullYear(), date.getMonth());
        break;
      case CalendarView.AGENDA:
        // Agenda loads upcoming events, not range-based
        this.state.loadUpcomingEvents();
        return;
    }

    this.state.loadEventsInRange(params);
  }

  /**
   * Gets the start of the week for a given date.
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = this.config.weekStartsOnMonday
      ? (day === 0 ? -6 : 1 - day)
      : -day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  /**
   * Parses a CalendarView from a route path.
   */
  private parseViewFromRoute(path: string): CalendarView | null {
    const viewMap: Record<string, CalendarView> = {
      'day': CalendarView.DAY,
      'week': CalendarView.WEEK,
      'month': CalendarView.MONTH,
      'agenda': CalendarView.AGENDA
    };
    return viewMap[path] || null;
  }
}
