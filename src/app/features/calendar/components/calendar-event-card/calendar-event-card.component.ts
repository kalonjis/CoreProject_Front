import {
  Component,
  Input,
  HostBinding,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  CalendarEvent,
  CalendarEventStatus,
  EventRecurrence
} from '../../models';
import {
  getContrastColor,
  toTransparent,
  getLightVariant
} from '../../utils';
import {
  EventStatusPipe,
  EventStatusIconPipe,
  IsRecurringPipe
} from '../../pipes';

/**
 * Calendar event card component.
 *
 * @description
 * Displays a calendar event as a compact card or bar.
 * Used in month, week, and day views.
 *
 * Features:
 * - Color coding based on event color
 * - Status indicators (confirmed, tentative, cancelled)
 * - Recurrence indicator
 * - All-day styling
 * - Compact mode for month view
 *
 * @example
 * ```html
 * <!-- Compact mode (month view) -->
 * <app-calendar-event-card
 *   [event]="event"
 *   [compact]="true"
 *   (click)="selectEvent(event)"
 * />
 *
 * <!-- Full mode (day/week view) -->
 * <app-calendar-event-card
 *   [event]="event"
 *   [compact]="false"
 *   [showTime]="true"
 * />
 * ```
 */
@Component({
    selector: 'app-calendar-event-card',
    imports: [
        CommonModule,
        EventStatusPipe,
        EventStatusIconPipe,
        IsRecurringPipe
    ],
    templateUrl: './calendar-event-card.component.html',
    styleUrl: './calendar-event-card.component.scss'
})
export class CalendarEventCardComponent {
  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** The event to display */
  @Input({ required: true })
  set event(value: CalendarEvent) {
    this._event.set(value);
  }
  protected  readonly _event = signal<CalendarEvent | null>(null);

  /** Whether to use compact display (single line) */
  @Input() compact: boolean = false;

  /** Whether to show the time */
  @Input() showTime: boolean = true;

  /** Whether to show status icon */
  @Input() showStatus: boolean = true;

  /** Whether to show recurrence icon */
  @Input() showRecurrence: boolean = true;

  // ===========================================================================
  // Host Bindings
  // ===========================================================================

  @HostBinding('class.compact')
  get isCompact(): boolean {
    return this.compact;
  }

  @HostBinding('class.cancelled')
  get isCancelled(): boolean {
    return this._event()?.status === CalendarEventStatus.CANCELLED;
  }

  @HostBinding('class.all-day')
  get isAllDay(): boolean {
    return this._event()?.allDay ?? false;
  }

  @HostBinding('style.--event-color')
  get eventColor(): string {
    return this._event()?.colorCode || '#3b82f6';
  }

  @HostBinding('style.--event-bg-color')
  get eventBgColor(): string {
    const color = this._event()?.colorCode || '#3b82f6';
    return this.compact ? toTransparent(color, 0.15) : getLightVariant(color);
  }

  @HostBinding('style.--event-text-color')
  get eventTextColor(): string {
    const color = this._event()?.colorCode || '#3b82f6';
    return this.compact ? color : getContrastColor(getLightVariant(color));
  }

  // ===========================================================================
  // Computed State
  // ===========================================================================

  /** Formatted time string */
  readonly timeString = computed(() => {
    const event = this._event();
    if (!event || event.allDay) return '';

    const start = new Date(event.startDateTime);
    return start.toLocaleTimeString('fr-BE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  });

  /** Formatted time range string */
  readonly timeRangeString = computed(() => {
    const event = this._event();
    if (!event || event.allDay) return 'Toute la journée';

    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    const formatTime = (date: Date) =>
      date.toLocaleTimeString('fr-BE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

    return `${formatTime(start)} - ${formatTime(end)}`;
  });

  /** Whether event is recurring */
  readonly isRecurring = computed(() => {
    const event = this._event();
    return event?.recurrence && event.recurrence !== EventRecurrence.NONE;
  });

  /** Event title */
  readonly title = computed(() => this._event()?.title ?? '');

  /** Event location */
  readonly location = computed(() => this._event()?.displayLocation ?? this._event()?.location ?? '');

  /** Event status */
  readonly status = computed(() => this._event()?.status ?? CalendarEventStatus.CONFIRMED);

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /** CalendarEventStatus enum for template */
  readonly CalendarEventStatus = CalendarEventStatus;
}
