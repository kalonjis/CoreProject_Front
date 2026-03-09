import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalendarEvent } from '../../models';
import { CALENDAR_CONFIG } from '../../calendar.config';
import {
  getMonthGrid,
  getWeekDayNames,
  isSameDay,
  isSameMonth,
  isToday,
  getEventsForDay,
  addMonths
} from '../../utils';

/**
 * Mini calendar component for sidebar navigation.
 *
 * @description
 * Displays a compact month view for quick date navigation.
 * Shows event indicators as dots on days with events.
 *
 * @example
 * ```html
 * <app-calendar-mini-month
 *   [currentDate]="selectedDate"
 *   [events]="allEvents"
 *   (dateSelect)="navigateToDate($event)"
 * />
 * ```
 */
@Component({
    selector: 'app-calendar-mini-month',
    imports: [CommonModule],
    templateUrl: './calendar-mini-month.component.html',
    styleUrl: './calendar-mini-month.component.scss'
})
export class CalendarMiniMonthComponent {
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  protected readonly config = inject(CALENDAR_CONFIG);

  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** Currently selected/displayed date */
  @Input()
  set currentDate(value: Date) {
    this._currentDate.set(value);
    // Update displayed month to match selected date
    this._displayedMonth.set(new Date(value.getFullYear(), value.getMonth(), 1));
  }
  private readonly _currentDate = signal<Date>(new Date());

  /** Events to show indicators for */
  @Input()
  set events(value: CalendarEvent[]) {
    this._events.set(value);
  }
  private readonly _events = signal<CalendarEvent[]>([]);

  // ===========================================================================
  // Outputs
  // ===========================================================================

  /** Emits when a date is selected */
  @Output() dateSelect = new EventEmitter<Date>();

  // ===========================================================================
  // Local State
  // ===========================================================================

  /** The month currently being displayed (can differ from currentDate) */
  private readonly _displayedMonth = signal<Date>(new Date());

  // ===========================================================================
  // Computed State
  // ===========================================================================

  /** Week day names */
  readonly weekDayNames = computed(() =>
    getWeekDayNames(this.config.weekStartsOnMonday, 'narrow', this.config.locale)
  );

  /** Month grid for display */
  readonly monthGrid = computed(() => {
    const date = this._displayedMonth();
    return getMonthGrid(
      date.getFullYear(),
      date.getMonth(),
      this.config.weekStartsOnMonday
    );
  });

  /** Weeks for template */
  readonly weeks = computed(() => {
    const grid = this.monthGrid();
    const weeks: Date[][] = [];
    for (let i = 0; i < 6; i++) {
      weeks.push(grid.slice(i * 7, (i + 1) * 7));
    }
    return weeks;
  });

  /** Display month/year title */
  readonly displayTitle = computed(() => {
    const date = this._displayedMonth();
    return new Intl.DateTimeFormat(this.config.locale, {
      month: 'long',
      year: 'numeric'
    }).format(date);
  });

  /** Currently displayed month (0-11) */
  readonly displayedMonth = computed(() => this._displayedMonth().getMonth());

  /** Currently displayed year */
  readonly displayedYear = computed(() => this._displayedMonth().getFullYear());

  // ===========================================================================
  // Navigation
  // ===========================================================================

  /**
   * Navigate to previous month.
   */
  previousMonth(): void {
    this._displayedMonth.update(date => addMonths(date, -1));
  }

  /**
   * Navigate to next month.
   */
  nextMonth(): void {
    this._displayedMonth.update(date => addMonths(date, 1));
  }

  /**
   * Navigate to today's month.
   */
  goToToday(): void {
    const today = new Date();
    this._displayedMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
    this.dateSelect.emit(today);
  }

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /**
   * Checks if a day is the currently selected date.
   */
  isSelected(day: Date): boolean {
    return isSameDay(day, this._currentDate());
  }

  /**
   * Checks if a day is today.
   */
  isToday(day: Date): boolean {
    return isToday(day);
  }

  /**
   * Checks if a day is in the displayed month.
   */
  isCurrentMonth(day: Date): boolean {
    return isSameMonth(day, this._displayedMonth());
  }

  /**
   * Checks if a day has events.
   */
  hasEvents(day: Date): boolean {
    return getEventsForDay(this._events(), day).length > 0;
  }

  /**
   * Gets the number of events for a day (for tooltip).
   */
  getEventCount(day: Date): number {
    return getEventsForDay(this._events(), day).length;
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Handles click on a day.
   */
  onDayClick(day: Date): void {
    this.dateSelect.emit(day);
  }

  /**
   * TrackBy for weeks.
   */
  trackByWeek(index: number): number {
    return index;
  }

  /**
   * TrackBy for days.
   */
  trackByDay(index: number, day: Date): number {
    return day.getTime();
  }
}
