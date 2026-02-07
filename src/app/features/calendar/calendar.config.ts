import { InjectionToken } from '@angular/core';
import { CalendarView, CalendarEventStatus, EventRecurrence } from './models';
import { DEFAULT_EVENT_COLORS } from './utils';

/**
 * Configuration options for the calendar feature.
 *
 * @description
 * Provides customizable settings for the calendar module.
 * Can be overridden at the application level via dependency injection.
 */
export interface CalendarConfig {
  /**
   * Default view when loading the calendar.
   * @default CalendarView.MONTH
   */
  defaultView: CalendarView;

  /**
   * Whether the week starts on Monday.
   * @default true
   */
  weekStartsOnMonday: boolean;

  /**
   * First hour shown in day/week views.
   * @default 8
   */
  dayStartHour: number;

  /**
   * Last hour shown in day/week views.
   * @default 20
   */
  dayEndHour: number;

  /**
   * Time slot interval in minutes for day/week views.
   * @default 30
   */
  timeSlotInterval: number;

  /**
   * Default event duration in minutes when creating new events.
   * @default 60
   */
  defaultEventDuration: number;

  /**
   * Default status for new events.
   * @default CalendarEventStatus.CONFIRMED
   */
  defaultEventStatus: CalendarEventStatus;

  /**
   * Default recurrence for new events.
   * @default EventRecurrence.NONE
   */
  defaultEventRecurrence: EventRecurrence;

  /**
   * Available colors for events.
   */
  eventColors: readonly string[];

  /**
   * Default color for new events.
   * @default '#3B82F6'
   */
  defaultEventColor: string;

  /**
   * Default reminder time in minutes before event.
   * @default 15
   */
  defaultReminderMinutes: number;

  /**
   * Available reminder options (in minutes).
   */
  reminderOptions: readonly number[];

  /**
   * Locale for date formatting.
   * @default 'fr-BE'
   */
  locale: string;

  /**
   * Maximum years in the future for event creation.
   * @default 5
   */
  maxFutureYears: number;

  /**
   * Whether to show week numbers in month view.
   * @default true
   */
  showWeekNumbers: boolean;

  /**
   * Whether to show cancelled events by default.
   * @default true
   */
  showCancelledEvents: boolean;

  /**
   * Number of upcoming events to show in agenda preview.
   * @default 10
   */
  upcomingEventsLimit: number;

  /**
   * Whether to enable drag and drop for events.
   * @default true
   */
  enableDragDrop: boolean;

  /**
   * Whether to enable event resizing.
   * @default true
   */
  enableResize: boolean;

  /**
   * API base URL for calendar endpoints.
   * @default '/api/calendar'
   */
  apiBaseUrl: string;
}

/**
 * Default calendar configuration.
 */
export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  defaultView: CalendarView.MONTH,
  weekStartsOnMonday: true,
  dayStartHour: 8,
  dayEndHour: 20,
  timeSlotInterval: 30,
  defaultEventDuration: 60,
  defaultEventStatus: CalendarEventStatus.CONFIRMED,
  defaultEventRecurrence: EventRecurrence.NONE,
  eventColors: DEFAULT_EVENT_COLORS,
  defaultEventColor: '#3B82F6',
  defaultReminderMinutes: 15,
  reminderOptions: [0, 5, 10, 15, 30, 60, 120, 1440] as const, // 0, 5min, 10min, 15min, 30min, 1h, 2h, 1 day
  locale: 'fr-BE',
  maxFutureYears: 5,
  showWeekNumbers: true,
  showCancelledEvents: true,
  upcomingEventsLimit: 10,
  enableDragDrop: true,
  enableResize: true,
  apiBaseUrl: '/api/calendar'
};

/**
 * Injection token for calendar configuration.
 *
 * @description
 * Use this token to provide custom configuration at the application level.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: CALENDAR_CONFIG,
 *       useValue: {
 *         ...DEFAULT_CALENDAR_CONFIG,
 *         defaultView: CalendarView.WEEK,
 *         weekStartsOnMonday: false
 *       }
 *     }
 *   ]
 * };
 * ```
 */
export const CALENDAR_CONFIG = new InjectionToken<CalendarConfig>('CALENDAR_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_CALENDAR_CONFIG
});

/**
 * Provides calendar configuration.
 *
 * @description
 * Helper function to provide custom calendar configuration.
 *
 * @param config - Partial configuration to merge with defaults
 * @returns Provider for the calendar configuration
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCalendarConfig({
 *       defaultView: CalendarView.WEEK,
 *       locale: 'fr-FR'
 *     })
 *   ]
 * };
 * ```
 */
export function provideCalendarConfig(config: Partial<CalendarConfig>) {
  return {
    provide: CALENDAR_CONFIG,
    useValue: { ...DEFAULT_CALENDAR_CONFIG, ...config }
  };
}

/**
 * Reminder options with labels for UI display.
 */
export const REMINDER_OPTIONS_WITH_LABELS = [
  { value: 0, label: 'Aucun rappel' },
  { value: 5, label: '5 minutes avant' },
  { value: 10, label: '10 minutes avant' },
  { value: 15, label: '15 minutes avant' },
  { value: 30, label: '30 minutes avant' },
  { value: 60, label: '1 heure avant' },
  { value: 120, label: '2 heures avant' },
  { value: 1440, label: '1 jour avant' },
  { value: 2880, label: '2 jours avant' },
  { value: 10080, label: '1 semaine avant' }
] as const;

/**
 * Duration options with labels for UI display.
 */
export const DURATION_OPTIONS_WITH_LABELS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 heure' },
  { value: 90, label: '1h 30' },
  { value: 120, label: '2 heures' },
  { value: 180, label: '3 heures' },
  { value: 240, label: '4 heures' },
  { value: 480, label: '8 heures' },
  { value: 1440, label: 'Journée entière' }
] as const;
