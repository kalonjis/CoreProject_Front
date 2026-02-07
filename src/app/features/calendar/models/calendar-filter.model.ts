import { CalendarEventStatus } from './calendar-event-status.enum';
import { EventRecurrence } from './event-recurrence.enum';

/**
 * State representing the active filters in the calendar UI.
 *
 * @description
 * This interface represents the client-side filter state.
 * It's used to filter the displayed events without making new API calls
 * (local filtering) or to build query parameters for server-side filtering.
 *
 * @example
 * ```typescript
 * const filters: CalendarFilterState = {
 *   statuses: [CalendarEventStatus.CONFIRMED, CalendarEventStatus.TENTATIVE],
 *   searchQuery: 'meeting',
 *   showCancelled: false
 * };
 * ```
 */
export interface CalendarFilterState {
  /**
   * Filter by event statuses.
   * Empty array means no status filter (show all).
   */
  statuses: CalendarEventStatus[];

  /**
   * Filter by recurrence patterns.
   * Empty array means no recurrence filter (show all).
   */
  recurrences: EventRecurrence[];

  /**
   * Free-text search query.
   * Searches in title, description, and location.
   */
  searchQuery: string;

  /**
   * Whether to include cancelled events in the view.
   * Separate from statuses filter for convenience.
   */
  showCancelled: boolean;

  /**
   * Filter by color codes.
   * Empty array means no color filter (show all).
   */
  colorCodes: string[];
}

/**
 * Default filter state (no filters applied).
 */
export const DEFAULT_CALENDAR_FILTER_STATE: CalendarFilterState = {
  statuses: [],
  recurrences: [],
  searchQuery: '',
  showCancelled: true,
  colorCodes: []
};

/**
 * Represents a single filter option in the UI.
 *
 * @description
 * Generic interface for filter dropdowns and checkboxes.
 *
 * @example
 * ```typescript
 * const statusOptions: FilterOption<CalendarEventStatus>[] = [
 *   { value: CalendarEventStatus.CONFIRMED, label: 'Confirmé', count: 12 },
 *   { value: CalendarEventStatus.TENTATIVE, label: 'Provisoire', count: 3 },
 *   { value: CalendarEventStatus.CANCELLED, label: 'Annulé', count: 1 }
 * ];
 * ```
 */
export interface FilterOption<T> {
  /** The filter value */
  value: T;

  /** Display label */
  label: string;

  /** Optional count of matching items */
  count?: number;

  /** Whether this option is currently selected */
  selected?: boolean;

  /** Optional icon name */
  icon?: string;

  /** Optional color (for color filters) */
  color?: string;
}

/**
 * Utility functions for working with calendar filters.
 */
export const CALENDAR_FILTER_UTILS = {
  /**
   * Checks if any filters are currently active.
   *
   * @param filters - Current filter state
   * @returns True if at least one filter is applied
   */
  hasActiveFilters: (filters: CalendarFilterState): boolean => {
    return (
      filters.statuses.length > 0 ||
      filters.recurrences.length > 0 ||
      filters.searchQuery.trim().length > 0 ||
      !filters.showCancelled ||
      filters.colorCodes.length > 0
    );
  },

  /**
   * Counts the number of active filters.
   *
   * @param filters - Current filter state
   * @returns Number of active filter criteria
   */
  countActiveFilters: (filters: CalendarFilterState): number => {
    let count = 0;
    if (filters.statuses.length > 0) count++;
    if (filters.recurrences.length > 0) count++;
    if (filters.searchQuery.trim().length > 0) count++;
    if (!filters.showCancelled) count++;
    if (filters.colorCodes.length > 0) count++;
    return count;
  },

  /**
   * Resets all filters to default state.
   *
   * @returns Default filter state
   */
  reset: (): CalendarFilterState => {
    return { ...DEFAULT_CALENDAR_FILTER_STATE };
  },

  /**
   * Creates a partial filter update (for spread updates).
   *
   * @param current - Current filter state
   * @param updates - Partial updates to apply
   * @returns New filter state with updates applied
   */
  update: (
    current: CalendarFilterState,
    updates: Partial<CalendarFilterState>
  ): CalendarFilterState => {
    return { ...current, ...updates };
  }
};
