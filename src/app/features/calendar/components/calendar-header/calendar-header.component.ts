import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  CalendarView,
  CALENDAR_VIEW_LABELS,
  CALENDAR_VIEW_ICONS,
  CalendarViewUtils
} from '../../models';

/**
 * Calendar header component with navigation and view controls.
 *
 * @description
 * Displays the calendar title, navigation buttons (previous/today/next),
 * view switcher, and action buttons.
 *
 * Features:
 * - Title display (current month/week/day)
 * - Navigation (previous, today, next)
 * - View mode switcher (day/week/month/agenda)
 * - Create event button
 * - Sidebar and filter toggles (mobile)
 *
 * @example
 * ```html
 * <app-calendar-header
 *   [title]="'Février 2025'"
 *   [currentView]="CalendarView.MONTH"
 *   [loading]="false"
 *   (viewChange)="onViewChange($event)"
 *   (todayClick)="goToToday()"
 *   (previousClick)="goToPrevious()"
 *   (nextClick)="goToNext()"
 *   (createClick)="createEvent()"
 * />
 * ```
 */
@Component({
  selector: 'app-calendar-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-header.component.html',
  styleUrl: './calendar-header.component.scss'
})
export class CalendarHeaderComponent {
  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** Title to display (e.g., "Février 2025") */
  @Input({ required: true }) title!: string;

  /** Current active view */
  @Input({ required: true }) currentView!: CalendarView;

  /** Whether data is currently loading */
  @Input() loading: boolean = false;

  /** Whether filters are currently active */
  @Input() hasActiveFilters: boolean = false;

  // ===========================================================================
  // Outputs
  // ===========================================================================

  /** Emits when the view mode changes */
  @Output() viewChange = new EventEmitter<CalendarView>();

  /** Emits when "Today" button is clicked */
  @Output() todayClick = new EventEmitter<void>();

  /** Emits when "Previous" button is clicked */
  @Output() previousClick = new EventEmitter<void>();

  /** Emits when "Next" button is clicked */
  @Output() nextClick = new EventEmitter<void>();

  /** Emits when "Create" button is clicked */
  @Output() createClick = new EventEmitter<void>();

  /** Emits when sidebar toggle is clicked (mobile) */
  @Output() toggleSidebar = new EventEmitter<void>();

  /** Emits when filters toggle is clicked (mobile) */
  @Output() toggleFilters = new EventEmitter<void>();

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /** All available views for the view switcher */
  readonly views = CalendarViewUtils.all();

  /** Labels for views */
  readonly viewLabels = CALENDAR_VIEW_LABELS;

  /** Icons for views */
  readonly viewIcons = CALENDAR_VIEW_ICONS;

  /** CalendarView enum for template */
  readonly CalendarView = CalendarView;

  // ===========================================================================
  // Methods
  // ===========================================================================

  /**
   * Handles view button click.
   */
  onViewClick(view: CalendarView): void {
    if (view !== this.currentView) {
      this.viewChange.emit(view);
    }
  }

  /**
   * Checks if a view is currently active.
   */
  isActiveView(view: CalendarView): boolean {
    return view === this.currentView;
  }

  /**
   * Gets the accessible label for navigation buttons.
   */
  getNavigationLabel(direction: 'previous' | 'next'): string {
    const viewName = this.viewLabels[this.currentView].toLowerCase();
    return direction === 'previous'
      ? `${viewName} précédent`
      : `${viewName} suivant`;
  }
}
