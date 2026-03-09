// src/app/features/calendar/components/calendar-week-view/calendar-week-view.component.ts

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
  getTimeSlots,
  getEventsForDay,
  calculateEventPositions,
  isToday,
  isSameDay,
  PositionedEvent
} from '../../utils';
import { CalendarDateService } from '../../services';
import { CalendarEventCardComponent } from '../calendar-event-card/calendar-event-card.component';

/**
 * Calendar week view component.
 *
 * @description
 * Displays a 7-day week view with time slots.
 * Each day column shows events positioned by time.
 *
 * @example
 * ```html
 * <app-calendar-week-view
 *   [date]="currentDate"
 *   [events]="filteredEvents"
 *   (eventSelect)="onEventClick($event)"
 *   (slotClick)="onTimeSlotClick($event)"
 *   (dateSelect)="onDateSelect($event)"
 * />
 * ```
 */
@Component({
    selector: 'app-calendar-week-view',
    imports: [CommonModule, CalendarEventCardComponent],
    templateUrl: './calendar-week-view.component.html',
    styleUrl: './calendar-week-view.component.scss'
})
export class CalendarWeekViewComponent {
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  protected readonly config = inject(CALENDAR_CONFIG);
  private readonly dateService = inject(CalendarDateService);

  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** Any date within the week to display */
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

  // ===========================================================================
  // Outputs
  // ===========================================================================

  /** Emits when an event is clicked */
  @Output() eventSelect = new EventEmitter<CalendarEvent>();

  /** Emits when a time slot is clicked */
  @Output() slotClick = new EventEmitter<Date>();

  /** Emits when a day header is clicked */
  @Output() dateSelect = new EventEmitter<Date>();

  // ===========================================================================
  // Computed State
  // ===========================================================================

  /** Days of the week */
  readonly weekDays = computed(() => {
    const date = this._date();
    return this.dateService.getWeekDays(date);
  });

  /** Time slots */
  readonly timeSlots = computed(() =>
    getTimeSlots(
      this.config.dayStartHour,
      this.config.dayEndHour,
      this.config.timeSlotInterval
    )
  );

  /** All-day events grouped by day */
  readonly allDayEventsByDay = computed(() => {
    const days = this.weekDays();
    const events = this._events();

    return days.map((day: Date) => ({
      day,
      events: getEventsForDay(events, day).filter(e => e.allDay)
    }));
  });

  /** Positioned events for each day */
  readonly positionedEventsByDay = computed(() => {
    const days = this.weekDays();
    const events = this._events();

    return days.map((day: Date) => {
      const dayEvents = getEventsForDay(events, day).filter(e => !e.allDay);
      return {
        day,
        events: calculateEventPositions(
          dayEvents,
          this.config.dayStartHour,
          this.config.dayEndHour
        )
      };
    });
  });

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /**
   * Checks if there are any all-day events in the week.
   */
  hasAllDayEvents(): boolean {
    return this.allDayEventsByDay().some(d => d.events.length > 0);
  }

  /**
   * Formats a day for the header.
   */
  formatDayHeader(day: Date): string {
    return new Intl.DateTimeFormat(this.config.locale, {
      weekday: 'short'
    }).format(day);
  }

  /**
   * Gets the day number.
   */
  getDayNumber(day: Date): number {
    return day.getDate();
  }

  /**
   * Checks if a day is today.
   */
  isToday(day: Date): boolean {
    return isToday(day);
  }

  /**
   * Checks if a day is selected.
   */
  isSelected(day: Date): boolean {
    return isSameDay(day, this._date());
  }

  /**
   * Gets event style for positioning.
   */
  getEventStyle(positioned: PositionedEvent): Record<string, string> {
    const widthPercent = 95 / positioned.totalColumns;
    const leftPercent = (positioned.column * widthPercent) + 2;

    return {
      'top': `${positioned.top}%`,
      'height': `${positioned.height}%`,
      'left': `${leftPercent}%`,
      'width': `${widthPercent}%`
    };
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Handles click on day header.
   */
  onDayClick(day: Date): void {
    this.dateSelect.emit(day);
  }

  /**
   * Handles click on time slot.
   */
  onSlotClick(day: Date, timeSlot: string): void {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const date = new Date(day);
    date.setHours(hours, minutes, 0, 0);
    this.slotClick.emit(date);
  }

  /**
   * Handles click on event.
   */
  onEventClick(event: CalendarEvent, e: Event): void {
    e.stopPropagation();
    this.eventSelect.emit(event);
  }

  /**
   * TrackBy for days.
   */
  trackByDay(index: number, item: { day: Date }): number {
    return item.day.getTime();
  }

  /**
   * TrackBy for time slots.
   */
  trackBySlot(index: number, slot: string): string {
    return slot;
  }

  /**
   * TrackBy for events.
   */
  trackByEvent(index: number, positioned: PositionedEvent): string {
    return positioned.event.publicId;
  }
}
