/**
 * Enum representing the available calendar view modes.
 *
 * @description
 * - DAY: Detailed view of a single day with time slots
 * - WEEK: Week view showing 7 days with time grid
 * - MONTH: Traditional month grid view
 * - AGENDA: Chronological list view of upcoming events
 *
 * @example
 * ```typescript
 * const currentView = signal<CalendarView>(CalendarView.MONTH);
 *
 * function switchToWeek(): void {
 *   currentView.set(CalendarView.WEEK);
 * }
 * ```
 */
export enum CalendarView {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  AGENDA = 'AGENDA'
}

/**
 * Display names for calendar views (French localization).
 *
 * @example
 * ```typescript
 * const view = CalendarView.MONTH;
 * const label = CALENDAR_VIEW_LABELS[view]; // "Mois"
 * ```
 */
export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
  [CalendarView.DAY]: 'Jour',
  [CalendarView.WEEK]: 'Semaine',
  [CalendarView.MONTH]: 'Mois',
  [CalendarView.AGENDA]: 'Agenda'
};

/**
 * Icons for calendar views (using icon library naming convention).
 *
 * @example
 * ```typescript
 * const view = CalendarView.MONTH;
 * const icon = CALENDAR_VIEW_ICONS[view]; // "calendar"
 * ```
 */
export const CALENDAR_VIEW_ICONS: Record<CalendarView, string> = {
  [CalendarView.DAY]: 'calendar-day',
  [CalendarView.WEEK]: 'calendar-week',
  [CalendarView.MONTH]: 'calendar',
  [CalendarView.AGENDA]: 'list'
};

/**
 * Utility functions for CalendarView.
 */
export const CalendarViewUtils = {
  /**
   * Returns all views as an array (useful for view switcher).
   */
  all: (): CalendarView[] => {
    return Object.values(CalendarView);
  },

  /**
   * Returns the default view.
   */
  default: (): CalendarView => {
    return CalendarView.MONTH;
  }
};
