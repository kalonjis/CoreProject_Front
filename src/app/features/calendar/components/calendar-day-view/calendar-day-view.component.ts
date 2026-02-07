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
  PositionedEvent
} from '../../utils';
import { CalendarEventCardComponent } from '../calendar-event-card/calendar-event-card.component';

/**
 * Calendar day view component.
 *
 * @description
 * Displays a detailed view of a single day with time slots.
 * Events are positioned based on their start/end times and
 * arranged in columns when overlapping.
 *
 * @example
 * ```html
 * <app-calendar-day-view
 *   [date]="selectedDate"
 *   [events]="filteredEvents"
 *   (eventSelect)="onEventClick($event)"
 *   (slotClick)="onTimeSlotClick($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-calendar-day-view',
  standalone: true,
  imports: [CommonModule, CalendarEventCardComponent],
  templateUrl: './calendar-day-view.component.html',
  styleUrl: './calendar-day-view.component.scss'
})
export class CalendarDayViewComponent {
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  protected readonly config = inject(CALENDAR_CONFIG);

  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** The date to display */
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

  // ===========================================================================
  // Computed State
  // ===========================================================================

  /** Time slots for the day */
  readonly timeSlots = computed(() =>
    getTimeSlots(
      this.config.dayStartHour,
      this.config.dayEndHour,
      this.config.timeSlotInterval
    )
  );

  /** All-day events for this day */
  readonly allDayEvents = computed(() => {
    const dayEvents = getEventsForDay(this._events(), this._date());
    return dayEvents.filter(e => e.allDay);
  });

  /** Timed events with positions */
  readonly positionedEvents = computed(() => {
    const dayEvents = getEventsForDay(this._events(), this._date());
    const timedEvents = dayEvents.filter(e => !e.allDay);
    return calculateEventPositions(
      timedEvents,
      this.config.dayStartHour,
      this.config.dayEndHour
    );
  });

  /** Formatted date title */
  readonly dateTitle = computed(() => {
    return new Intl.DateTimeFormat(this.config.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(this._date());
  });

  /** Current time line position (percentage) */
  readonly currentTimePosition = computed(() => {
    const now = new Date();
    const currentDate = this._date();

    // Only show if viewing today
    if (
      now.getDate() !== currentDate.getDate() ||
      now.getMonth() !== currentDate.getMonth() ||
      now.getFullYear() !== currentDate.getFullYear()
    ) {
      return null;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.config.dayStartHour * 60;
    const endMinutes = this.config.dayEndHour * 60;

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return null;
    }

    return ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
  });

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Handles click on a time slot.
   */
  onSlotClick(timeSlot: string): void {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const date = new Date(this._date());
    date.setHours(hours, minutes, 0, 0);
    this.slotClick.emit(date);
  }

  /**
   * Handles click on an event.
   */
  onEventClick(event: CalendarEvent, e: Event): void {
    e.stopPropagation();
    this.eventSelect.emit(event);
  }

  /**
   * Gets the style for a positioned event.
   */
  getEventStyle(positioned: PositionedEvent): Record<string, string> {
    const widthPercent = 100 / positioned.totalColumns;
    const leftPercent = positioned.column * widthPercent;

    return {
      'top': `${positioned.top}%`,
      'height': `${positioned.height}%`,
      'left': `${leftPercent}%`,
      'width': `calc(${widthPercent}% - 4px)`
    };
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
