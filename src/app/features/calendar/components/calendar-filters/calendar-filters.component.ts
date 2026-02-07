import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CalendarEvent,
  CalendarFilterState,
  CalendarEventStatus,
  EventRecurrence,
  CALENDAR_EVENT_STATUS_LABELS,
  EVENT_RECURRENCE_LABELS,
  CalendarEventStatusUtils,
  EventRecurrenceUtils
} from '../../models';
import { groupEventsByStatus } from '../../utils';

/**
 * Calendar filters component.
 *
 * @description
 * Provides UI controls for filtering calendar events by:
 * - Status (Tentative, Confirmed, Cancelled)
 * - Recurrence pattern
 * - Text search
 * - Color
 *
 * @example
 * ```html
 * <app-calendar-filters
 *   [filters]="currentFilters"
 *   [events]="allEvents"
 *   (filtersChange)="onFiltersChange($event)"
 *   (reset)="onResetFilters()"
 * />
 * ```
 */
@Component({
  selector: 'app-calendar-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-filters.component.html',
  styleUrl: './calendar-filters.component.scss'
})
export class CalendarFiltersComponent {
  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** Current filter state */
  @Input()
  set filters(value: CalendarFilterState) {
    this._filters.set(value);
  }
  private readonly _filters = signal<CalendarFilterState>({
    statuses: [],
    recurrences: [],
    searchQuery: '',
    showCancelled: true,
    colorCodes: []
  });

  /** All events (for calculating counts) */
  @Input()
  set events(value: CalendarEvent[]) {
    this._events.set(value);
  }
  private readonly _events = signal<CalendarEvent[]>([]);

  /** Whether the filters panel is expanded */
  @Input() expanded: boolean = true;

  // ===========================================================================
  // Outputs
  // ===========================================================================

  /** Emits when filters change */
  @Output() filtersChange = new EventEmitter<Partial<CalendarFilterState>>();

  /** Emits when reset button is clicked */
  @Output() reset = new EventEmitter<void>();

  // ===========================================================================
  // Local State
  // ===========================================================================

  /** Search input value */
  searchQuery = '';

  /** Sections collapse state */
  readonly sectionsOpen = signal<Record<string, boolean>>({
    status: true,
    recurrence: false,
    colors: false
  });

  // ===========================================================================
  // Computed State
  // ===========================================================================

  /** Status options with counts */
  readonly statusOptions = computed(() => {
    const events = this._events();
    const grouped = groupEventsByStatus(events);
    const currentFilters = this._filters();

    return CalendarEventStatusUtils.all().map(status => ({
      value: status,
      label: CALENDAR_EVENT_STATUS_LABELS[status],
      count: grouped.get(status)?.length || 0,
      selected: currentFilters.statuses.includes(status)
    }));
  });

  /** Recurrence options with counts */
  readonly recurrenceOptions = computed(() => {
    const events = this._events();
    const currentFilters = this._filters();

    return EventRecurrenceUtils.all().map(recurrence => {
      const count = events.filter(e => e.recurrence === recurrence).length;
      return {
        value: recurrence,
        label: EVENT_RECURRENCE_LABELS[recurrence],
        count,
        selected: currentFilters.recurrences.includes(recurrence)
      };
    });
  });

  /** Unique colors from events */
  readonly colorOptions = computed(() => {
    const events = this._events();
    const currentFilters = this._filters();
    const colorsMap = new Map<string, number>();

    events.forEach(event => {
      if (event.colorCode) {
        colorsMap.set(event.colorCode, (colorsMap.get(event.colorCode) || 0) + 1);
      }
    });

    return Array.from(colorsMap.entries()).map(([color, count]) => ({
      value: color,
      count,
      selected: currentFilters.colorCodes.includes(color)
    }));
  });

  /** Whether show cancelled is toggled off */
  readonly hideCancelled = computed(() => !this._filters().showCancelled);

  /** Active filters count */
  readonly activeFiltersCount = computed(() => {
    const f = this._filters();
    let count = 0;
    if (f.statuses.length > 0) count++;
    if (f.recurrences.length > 0) count++;
    if (f.searchQuery.trim()) count++;
    if (!f.showCancelled) count++;
    if (f.colorCodes.length > 0) count++;
    return count;
  });

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /** CalendarEventStatus enum for template */
  readonly CalendarEventStatus = CalendarEventStatus;

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Toggles a section's open/closed state.
   */
  toggleSection(section: string): void {
    this.sectionsOpen.update(state => ({
      ...state,
      [section]: !state[section]
    }));
  }

  /**
   * Checks if a section is open.
   */
  isSectionOpen(section: string): boolean {
    return this.sectionsOpen()[section] ?? false;
  }

  /**
   * Handles status checkbox change.
   */
  onStatusChange(status: CalendarEventStatus, checked: boolean): void {
    const current = this._filters().statuses;
    const updated = checked
      ? [...current, status]
      : current.filter(s => s !== status);

    this.filtersChange.emit({ statuses: updated });
  }

  /**
   * Handles recurrence checkbox change.
   */
  onRecurrenceChange(recurrence: EventRecurrence, checked: boolean): void {
    const current = this._filters().recurrences;
    const updated = checked
      ? [...current, recurrence]
      : current.filter(r => r !== recurrence);

    this.filtersChange.emit({ recurrences: updated });
  }

  /**
   * Handles color checkbox change.
   */
  onColorChange(color: string, checked: boolean): void {
    const current = this._filters().colorCodes;
    const updated = checked
      ? [...current, color]
      : current.filter(c => c !== color);

    this.filtersChange.emit({ colorCodes: updated });
  }

  /**
   * Handles show cancelled toggle.
   */
  onShowCancelledChange(show: boolean): void {
    this.filtersChange.emit({ showCancelled: show });
  }

  /**
   * Handles search input change.
   */
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.filtersChange.emit({ searchQuery: query });
  }

  /**
   * Clears the search query.
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.filtersChange.emit({ searchQuery: '' });
  }

  /**
   * Resets all filters.
   */
  onReset(): void {
    this.searchQuery = '';
    this.reset.emit();
  }
}
