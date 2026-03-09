import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalendarEvent } from '../../models';
import { CALENDAR_CONFIG } from '../../calendar.config';
import {
  getMonthGrid,
  getWeekDayNames,
  getWeekNumber,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  getEventsForDay,
  sortEventsByTime
} from '../../utils';

import { CalendarEventCardComponent } from '../calendar-event-card/calendar-event-card.component';

/**
 * Calendar month view component.
 *
 * @description
 * Displays a traditional month grid with events. Features:
 * - 6-week grid (42 days) including padding from adjacent months
 * - Week numbers (optional)
 * - Events displayed as colored bars
 * - Click to select date or event
 * - "More" indicator for days with many events
 *
 * @example
 * ```html
 * <app-calendar-month-view
 *   [date]="currentDate"
 *   [events]="filteredEvents"
 *   (eventSelect)="onEventClick($event)"
 *   (dateSelect)="onDateSelect($event)"
 *   (slotClick)="onCreateEvent($event)"
 * />
 * ```
 */
@Component({
    selector: 'app-calendar-month-view',
    imports: [CommonModule, CalendarEventCardComponent],
    templateUrl: './calendar-month-view.component.html',
    styleUrl: './calendar-month-view.component.scss'
})
export class CalendarMonthViewComponent {
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  protected readonly config = inject(CALENDAR_CONFIG);

  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** The month to display (any date within that month) */
  @Input({ required: true })
  set date(value: Date) {
    this._date.set(value);
  }
  private readonly _date = signal<Date>(new Date());

  /** Events to display */
  @Input()
  set events(value: CalendarEvent[]) {
    this._events.set(value);
  }
  private readonly _events = signal<CalendarEvent[]>([]);

  /** Maximum events to show per day before "more" link */
  @Input() maxEventsPerDay: number = 3;

  // ===========================================================================
  // Outputs
  // ===========================================================================

  /** Emits when an event is clicked */
  @Output() eventSelect = new EventEmitter<CalendarEvent>();

  /** Emits when a day is clicked (to navigate to day view) */
  @Output() dateSelect = new EventEmitter<Date>();

  /** Emits when empty area of a day is clicked (to create event) */
  @Output() slotClick = new EventEmitter<Date>();

  // ===========================================================================
  // Computed State
  // ===========================================================================

  /** Week day names for header */
  readonly weekDayNames = computed(() =>
    getWeekDayNames(this.config.weekStartsOnMonday, 'short', this.config.locale)
  );

  /** Grid of dates (42 days = 6 weeks) */
  readonly monthGrid = computed(() => {
    const date = this._date();
    return getMonthGrid(
      date.getFullYear(),
      date.getMonth(),
      this.config.weekStartsOnMonday
    );
  });

  /** Weeks array for template iteration */
  readonly weeks = computed(() => {
    const grid = this.monthGrid();
    const weeks: Date[][] = [];

    for (let i = 0; i < 6; i++) {
      weeks.push(grid.slice(i * 7, (i + 1) * 7));
    }

    return weeks;
  });

  /** Current month for comparison */
  readonly currentMonth = computed(() => this._date().getMonth());

  /** Current year for comparison */
  readonly currentYear = computed(() => this._date().getFullYear());

  // ===========================================================================
  // Template Methods
  // ===========================================================================

  /**
   * Gets events for a specific day.
   */
  getEventsForDay(day: Date): CalendarEvent[] {
    const events = getEventsForDay(this._events(), day);
    return sortEventsByTime(events);
  }

  /**
   * Gets visible events (limited to maxEventsPerDay).
   */
  getVisibleEvents(day: Date): CalendarEvent[] {
    return this.getEventsForDay(day).slice(0, this.maxEventsPerDay);
  }

  /**
   * Gets count of hidden events.
   */
  getHiddenEventsCount(day: Date): number {
    const total = this.getEventsForDay(day).length;
    return Math.max(0, total - this.maxEventsPerDay);
  }

  /**
   * Gets week number for a week row.
   */
  getWeekNumber(week: Date[]): number {
    // Use Thursday to determine week number (ISO standard)
    return getWeekNumber(week[3]);
  }

  /**
   * Checks if a day is in the current month.
   */
  isCurrentMonth(day: Date): boolean {
    return day.getMonth() === this.currentMonth() &&
      day.getFullYear() === this.currentYear();
  }

  /**
   * Checks if a day is today.
   */
  isToday(day: Date): boolean {
    return isToday(day);
  }

  /**
   * Checks if a day is a weekend.
   */
  isWeekend(day: Date): boolean {
    return isWeekend(day);
  }

  /**
   * Checks if a day is selected.
   */
  isSelected(day: Date): boolean {
    return isSameDay(day, this._date());
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Handles click on day number.
   */
  onDayClick(day: Date, event: Event): void {
    event.stopPropagation();
    this.dateSelect.emit(day);
  }

  /**
   * Handles click on day cell (empty area).
   */
  onCellClick(day: Date): void {
    this.slotClick.emit(day);
  }

  /**
   * Handles click on an event.
   */
  onEventClick(calendarEvent: CalendarEvent, event: Event): void {
    event.stopPropagation();
    this.eventSelect.emit(calendarEvent);
  }

  /**
   * Handles click on "more" link.
   */
  onMoreClick(day: Date, event: Event): void {
    event.stopPropagation();
    this.dateSelect.emit(day);
  }

  /**
   * TrackBy function for weeks.
   */
  trackByWeek(index: number, week: Date[]): number {
    return this.getWeekNumber(week);
  }

  /**
   * TrackBy function for days.
   */
  trackByDay(index: number, day: Date): number {
    return day.getTime();
  }

  /**
   * TrackBy function for events.
   */
  trackByEvent(index: number, event: CalendarEvent): string {
    return event.publicId;
  }
}
