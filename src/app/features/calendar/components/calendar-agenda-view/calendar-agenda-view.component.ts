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
  groupEventsByDate,
  sortEventsByTime,
  isToday,
  isSameDay
} from '../../utils';
import {
  RelativeDatePipe,
  DateRangePipe,
  EventStatusPipe,
  IsRecurringPipe
} from '../../pipes';
import { CalendarEventCardComponent } from '../calendar-event-card/calendar-event-card.component';

/**
 * Date group with events for agenda display.
 */
interface DateGroup {
  date: Date;
  dateKey: string;
  events: CalendarEvent[];
  isToday: boolean;
}

/**
 * Calendar agenda view component.
 *
 * @description
 * Displays events in a chronological list grouped by date.
 * Shows upcoming events with relative date labels.
 *
 * @example
 * ```html
 * <app-calendar-agenda-view
 *   [events]="upcomingEvents"
 *   (eventSelect)="onEventClick($event)"
 * />
 * ```
 */
@Component({
    selector: 'app-calendar-agenda-view',
    imports: [
        CommonModule,
        CalendarEventCardComponent,
        RelativeDatePipe,
        DateRangePipe,
        EventStatusPipe,
        IsRecurringPipe
    ],
    templateUrl: './calendar-agenda-view.component.html',
    styleUrl: './calendar-agenda-view.component.scss'
})
export class CalendarAgendaViewComponent {
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  protected readonly config = inject(CALENDAR_CONFIG);

  // ===========================================================================
  // Inputs
  // ===========================================================================

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

  // ===========================================================================
  // Computed State
  // ===========================================================================

  /** Events grouped by date */
  readonly dateGroups = computed<DateGroup[]>(() => {
    const events = this._events();
    const sorted = sortEventsByTime(events);
    const grouped = groupEventsByDate(sorted);

    // Convert to array and sort by date
    const groups: DateGroup[] = [];

    grouped.forEach((groupEvents, dateKey) => {
      const date = new Date(dateKey);
      groups.push({
        date,
        dateKey,
        events: groupEvents,
        isToday: isToday(date)
      });
    });

    // Sort groups by date
    groups.sort((a, b) => a.date.getTime() - b.date.getTime());

    return groups;
  });

  /** Whether there are any events to display */
  readonly hasEvents = computed(() => this._events().length > 0);

  /** Total event count */
  readonly totalCount = computed(() => this._events().length);

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /**
   * Formats a date for the group header.
   */
  formatDateHeader(date: Date): string {
    return new Intl.DateTimeFormat(this.config.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  }

  /**
   * Formats the time range for an event.
   */
  formatEventTime(event: CalendarEvent): string {
    if (event.allDay) {
      return 'Toute la journée';
    }

    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    const formatTime = (d: Date) =>
      d.toLocaleTimeString(this.config.locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  /**
   * Checks if a date is today.
   */
  isToday(date: Date): boolean {
    return isToday(date);
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Handles click on an event.
   */
  onEventClick(event: CalendarEvent): void {
    this.eventSelect.emit(event);
  }

  /**
   * TrackBy for date groups.
   */
  trackByGroup(index: number, group: DateGroup): string {
    return group.dateKey;
  }

  /**
   * TrackBy for events.
   */
  trackByEvent(index: number, event: CalendarEvent): string {
    return event.publicId;
  }
}
