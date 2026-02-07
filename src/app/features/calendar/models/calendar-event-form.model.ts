import { CalendarEventStatus } from './calendar-event-status.enum';
import { EventRecurrence } from './event-recurrence.enum';

/**
 * Address input for creating/updating an event.
 *
 * Aligned with backend DTO: AddressInput
 *
 * @description
 * Used when the user wants to associate a physical address with an event.
 * The backend will handle deduplication and geocoding.
 */
export interface AddressInput {
  /** Street name */
  streetName: string;

  /** Street/building number */
  streetNumber: string;

  /** Postal/ZIP code */
  postalCode: string;

  /** City name */
  city: string;

  /** ISO 3166-1 alpha-2 country code (e.g., "BE", "FR") */
  countryCode: string;
}

/**
 * Request payload for creating a new calendar event.
 *
 * Aligned with backend DTO: CreateEventRequest
 *
 * @description
 * All fields except title and dates are optional.
 * The backend will apply defaults for status (CONFIRMED) and recurrence (NONE).
 *
 * @example
 * ```typescript
 * const request: CreateCalendarEventRequest = {
 *   title: 'Team Meeting',
 *   startDateTime: '2025-02-10T14:00:00Z',
 *   endDateTime: '2025-02-10T15:00:00Z',
 *   allDay: false,
 *   status: CalendarEventStatus.CONFIRMED,
 *   recurrence: EventRecurrence.WEEKLY,
 *   location: 'Conference Room A'
 * };
 * ```
 */
export interface CreateCalendarEventRequest {
  /** Event title/summary (required, max 200 chars) */
  title: string;

  /** Detailed description (optional, max 5000 chars) */
  description?: string;

  /** Free-text location description */
  location?: string;

  /** Structured physical address (optional) */
  address?: AddressInput;

  /** Event start date/time in ISO 8601 format (required) */
  startDateTime: string;

  /** Event end date/time in ISO 8601 format (required) */
  endDateTime: string;

  /** Whether this is an all-day event (default: false) */
  allDay?: boolean;

  /** Event status (default: CONFIRMED) */
  status?: CalendarEventStatus;

  /** Recurrence pattern (default: NONE) */
  recurrence?: EventRecurrence;

  /** Hex color code for UI display (e.g., "#FF5733") */
  colorCode?: string;

  /** Minutes before event to trigger reminder */
  reminderMinutes?: number;
}

/**
 * Request payload for updating an existing calendar event.
 *
 * Aligned with backend DTO: UpdateEventRequest
 *
 * @description
 * Supports partial updates - only provided fields will be modified.
 * All fields are optional.
 *
 * @example
 * ```typescript
 * // Update only the title and status
 * const request: UpdateCalendarEventRequest = {
 *   title: 'Updated Meeting Title',
 *   status: CalendarEventStatus.CANCELLED
 * };
 * ```
 */
export interface UpdateCalendarEventRequest {
  /** Event title/summary (max 200 chars) */
  title?: string;

  /** Detailed description (max 5000 chars) */
  description?: string;

  /** Free-text location description */
  location?: string;

  /** Structured physical address */
  address?: AddressInput;

  /** Event start date/time in ISO 8601 format */
  startDateTime?: string;

  /** Event end date/time in ISO 8601 format */
  endDateTime?: string;

  /** Whether this is an all-day event */
  allDay?: boolean;

  /** Event status */
  status?: CalendarEventStatus;

  /** Recurrence pattern */
  recurrence?: EventRecurrence;

  /** Hex color code for UI display */
  colorCode?: string;

  /** Minutes before event to trigger reminder */
  reminderMinutes?: number;
}

/**
 * Form state for the calendar event form component.
 *
 * @description
 * Represents the internal state of the reactive form.
 * Dates are stored as Date objects for easier manipulation with date pickers.
 *
 * @example
 * ```typescript
 * const formState: CalendarEventFormState = {
 *   title: 'Meeting',
 *   startDate: new Date(),
 *   startTime: '14:00',
 *   endDate: new Date(),
 *   endTime: '15:00',
 *   allDay: false,
 *   // ...
 * };
 * ```
 */
export interface CalendarEventFormState {
  title: string;
  description: string;
  location: string;
  address: AddressInput | null;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  allDay: boolean;
  status: CalendarEventStatus;
  recurrence: EventRecurrence;
  colorCode: string;
  reminderMinutes: number | null;
}

/**
 * Default values for a new calendar event form.
 */
export const DEFAULT_EVENT_FORM_STATE: CalendarEventFormState = {
  title: '',
  description: '',
  location: '',
  address: null,
  startDate: new Date(),
  startTime: '09:00',
  endDate: new Date(),
  endTime: '10:00',
  allDay: false,
  status: CalendarEventStatus.CONFIRMED,
  recurrence: EventRecurrence.NONE,
  colorCode: '#3B82F6',
  reminderMinutes: 15
};
