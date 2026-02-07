/**
 * Calendar Pipes Barrel Export
 *
 * @description
 * Central export point for all calendar-related pipes.
 * All pipes are standalone and can be imported directly into components.
 *
 * @example
 * ```typescript
 * import {
 *   EventStatusPipe,
 *   EventRecurrencePipe,
 *   RelativeDatePipe,
 *   DateRangePipe
 * } from '@features/calendar/pipes';
 *
 * @Component({
 *   imports: [
 *     EventStatusPipe,
 *     EventRecurrencePipe,
 *     RelativeDatePipe,
 *     DateRangePipe
 *   ]
 * })
 * export class EventCardComponent {}
 * ```
 *
 * @example
 * ```html
 * <div class="event-card">
 *   <span [ngClass]="event.status | eventStatusClass">
 *     {{ event.status | eventStatus }}
 *   </span>
 *   <span>{{ event | dateRange }}</span>
 *   <span>{{ event.startDateTime | relativeDate }}</span>
 *   @if (event.recurrence | isRecurring) {
 *     <span>{{ event.recurrence | eventRecurrence }}</span>
 *   }
 * </div>
 * ```
 */

// =============================================================================
// Event Status Pipes
// =============================================================================

export {
  EventStatusPipe,
  EventStatusClassPipe,
  EventStatusIconPipe,
  EventStatusColorPipe
} from './event-status.pipe';

// =============================================================================
// Event Recurrence Pipes
// =============================================================================

export {
  EventRecurrencePipe,
  EventRecurrenceIconPipe,
  EventRecurrenceDescriptionPipe,
  IsRecurringPipe
} from './event-recurrence.pipe';

// =============================================================================
// Date Pipes
// =============================================================================

export {
  RelativeDatePipe,
  EventTimingPipe,
  DateRangePipe
} from './relative-date.pipe';

// =============================================================================
// Convenience: All Pipes Array
// =============================================================================

import { EventStatusPipe, EventStatusClassPipe, EventStatusIconPipe, EventStatusColorPipe } from './event-status.pipe';
import { EventRecurrencePipe, EventRecurrenceIconPipe, EventRecurrenceDescriptionPipe, IsRecurringPipe } from './event-recurrence.pipe';
import { RelativeDatePipe, EventTimingPipe, DateRangePipe } from './relative-date.pipe';

/**
 * Array of all calendar pipes for easy bulk import.
 *
 * @example
 * ```typescript
 * @Component({
 *   imports: [...CALENDAR_PIPES]
 * })
 * export class CalendarComponent {}
 * ```
 */
export const CALENDAR_PIPES = [
  EventStatusPipe,
  EventStatusClassPipe,
  EventStatusIconPipe,
  EventStatusColorPipe,
  EventRecurrencePipe,
  EventRecurrenceIconPipe,
  EventRecurrenceDescriptionPipe,
  IsRecurringPipe,
  RelativeDatePipe,
  EventTimingPipe,
  DateRangePipe
] as const;
