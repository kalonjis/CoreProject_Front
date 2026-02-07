import { CalendarEventStatus } from './calendar-event-status.enum';
import { EventRecurrence } from './event-recurrence.enum';

/**
 * Address information for a calendar event location.
 *
 * Aligned with backend DTO: AddressDTO
 *
 * @description
 * Represents a physical address associated with an event.
 * Used when the event has a specific location that can be mapped.
 */
export interface CalendarEventAddress {
  /** Unique public identifier for the address */
  publicId: string;

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

  /** Optional latitude for map display */
  latitude?: number;

  /** Optional longitude for map display */
  longitude?: number;
}

/**
 * Main interface representing a calendar event.
 *
 * Aligned with backend DTO: CalendarEventResponse
 *
 * @description
 * This interface mirrors the REST API response structure.
 * All datetime fields are ISO 8601 strings (UTC).
 *
 * @example
 * ```typescript
 * const event: CalendarEvent = {
 *   publicId: '550e8400-e29b-41d4-a716-446655440000',
 *   ownerPublicId: 'user-123',
 *   title: 'Team Meeting',
 *   startDateTime: '2025-02-10T14:00:00Z',
 *   endDateTime: '2025-02-10T15:00:00Z',
 *   allDay: false,
 *   status: CalendarEventStatus.CONFIRMED,
 *   recurrence: EventRecurrence.WEEKLY,
 *   // ...
 * };
 * ```
 */
export interface CalendarEvent {
  /** Unique public identifier (UUID) - used for API operations */
  publicId: string;

  /** Public ID of the event owner (User) */
  ownerPublicId: string;

  /** Event title/summary (max 200 chars) */
  title: string;

  /** Detailed description (optional, max 5000 chars) */
  description: string | null;

  /** Free-text location description (e.g., "Room A", "Teams call") */
  location: string | null;

  /** Structured physical address (optional) */
  address: CalendarEventAddress | null;

  /** Combined display string for UI (location + address formatted) */
  displayLocation: string | null;

  /** Event start date/time in ISO 8601 format (UTC) */
  startDateTime: string;

  /** Event end date/time in ISO 8601 format (UTC) */
  endDateTime: string;

  /** Whether this is an all-day event */
  allDay: boolean;

  /** Current status of the event */
  status: CalendarEventStatus;

  /** Recurrence pattern */
  recurrence: EventRecurrence;

  /** Hex color code for UI display (e.g., "#FF5733") */
  colorCode: string | null;

  /** Minutes before event to trigger reminder */
  reminderMinutes: number | null;

  /** Creation timestamp in ISO 8601 format (UTC) */
  createdAt: string;

  /** Last update timestamp in ISO 8601 format (UTC) */
  updatedAt: string;
}

/**
 * Type guard to check if an object is a valid CalendarEvent.
 *
 * @param obj - Object to validate
 * @returns True if the object has all required CalendarEvent properties
 *
 * @example
 * ```typescript
 * if (isCalendarEvent(response.data)) {
 *   console.log(response.data.title);
 * }
 * ```
 */
export function isCalendarEvent(obj: unknown): obj is CalendarEvent {
  if (!obj || typeof obj !== 'object') return false;

  const event = obj as Partial<CalendarEvent>;

  return (
    typeof event.publicId === 'string' &&
    typeof event.ownerPublicId === 'string' &&
    typeof event.title === 'string' &&
    typeof event.startDateTime === 'string' &&
    typeof event.endDateTime === 'string' &&
    typeof event.allDay === 'boolean' &&
    Object.values(CalendarEventStatus).includes(event.status as CalendarEventStatus) &&
    Object.values(EventRecurrence).includes(event.recurrence as EventRecurrence)
  );
}
