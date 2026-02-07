/**
 * Calendar Models Barrel Export
 *
 * @description
 * Central export point for all calendar-related models, enums, and interfaces.
 * Import from this file to avoid deep import paths.
 *
 * @example
 * ```typescript
 * import {
 *   CalendarEvent,
 *   CalendarEventStatus,
 *   EventRecurrence,
 *   CreateCalendarEventRequest
 * } from '@features/calendar/models';
 * ```
 */

// =============================================================================
// Enums
// =============================================================================

export {
  CalendarEventStatus,
  CALENDAR_EVENT_STATUS_LABELS,
  CalendarEventStatusUtils
} from './calendar-event-status.enum';

export {
  EventRecurrence,
  EVENT_RECURRENCE_LABELS,
  EventRecurrenceUtils
} from './event-recurrence.enum';

export {
  CalendarView,
  CALENDAR_VIEW_LABELS,
  CALENDAR_VIEW_ICONS,
  CalendarViewUtils
} from './calendar-view.enum';

// =============================================================================
// Core Models
// =============================================================================

export type {
  CalendarEvent,
  CalendarEventAddress,
  isCalendarEvent
} from './calendar-event.model';

// =============================================================================
// Form Models
// =============================================================================

export type {
  AddressInput,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  CalendarEventFormState,
  DEFAULT_EVENT_FORM_STATE
} from './calendar-event-form.model';

// =============================================================================
// Query Parameters
// =============================================================================

export type {
  DateRangeParams,
  StatusFilterParams,
  EventQueryParams,
} from './calendar-query-params.model';


export {
  QueryParamsUtils
} from './calendar-query-params.model';

// =============================================================================
// External Calendar / Export
// =============================================================================

export type {
  CalendarUrlsResponse,
  CalendarExportOptions
} from './calendar-urls.model';

export {
  ExternalCalendarProvider
} from './calendar-urls.model';


export {
  EXTERNAL_CALENDAR_PROVIDER_LABELS,
  EXTERNAL_CALENDAR_PROVIDER_ICONS
} from './calendar-urls.model';

// =============================================================================
// UI Filters
// =============================================================================

export type{
  CalendarFilterState,
  FilterOption,
} from './calendar-filter.model';

export {
  DEFAULT_CALENDAR_FILTER_STATE,
  CALENDAR_FILTER_UTILS,
} from './calendar-filter.model';
