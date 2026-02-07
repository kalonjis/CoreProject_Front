import {
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalendarView, CalendarEvent } from '../../models';

import { CalendarDayViewComponent } from '../calendar-day-view/calendar-day-view.component';
import { CalendarWeekViewComponent } from '../calendar-week-view/calendar-week-view.component';
import { CalendarMonthViewComponent } from '../calendar-month-view/calendar-month-view.component';
import { CalendarAgendaViewComponent } from '../calendar-agenda-view/calendar-agenda-view.component';

/**
 * View switcher component that renders the appropriate calendar view.
 *
 * @description
 * Acts as a container that dynamically displays the correct calendar view
 * based on the currentView input. Forwards events and data to child views.
 *
 * This component can be replaced by Angular Router's <router-outlet>
 * if views are configured as child routes.
 *
 * @example
 * ```html
 * <app-calendar-view-switcher
 *   [currentView]="CalendarView.MONTH"
 *   [currentDate]="selectedDate"
 *   [events]="filteredEvents"
 *   (eventSelect)="onEventClick($event)"
 *   (slotClick)="onTimeSlotClick($event)"
 *   (dateSelect)="onDateChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-calendar-view-switcher',
  standalone: true,
  imports: [
    CommonModule,
    CalendarDayViewComponent,
    CalendarWeekViewComponent,
    CalendarMonthViewComponent,
    CalendarAgendaViewComponent
  ],
  templateUrl: './calendar-view-switcher.component.html',
  styleUrl: './calendar-view-switcher.component.scss'
})
export class CalendarViewSwitcherComponent {
  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** Current view mode to display */
  @Input({ required: true }) currentView!: CalendarView;

  /** Currently selected/displayed date */
  @Input({ required: true }) currentDate!: Date;

  /** Events to display in the view */
  @Input() events: CalendarEvent[] = [];

  // ===========================================================================
  // Outputs
  // ===========================================================================

  /** Emits when an event is clicked */
  @Output() eventSelect = new EventEmitter<CalendarEvent>();

  /** Emits when an empty time slot is clicked */
  @Output() slotClick = new EventEmitter<Date>();

  /** Emits when a date is selected (e.g., clicking a day number) */
  @Output() dateSelect = new EventEmitter<Date>();

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /** Expose CalendarView enum to template */
  readonly CalendarView = CalendarView;

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Forwards event selection to parent.
   */
  onEventSelect(event: CalendarEvent): void {
    this.eventSelect.emit(event);
  }

  /**
   * Forwards slot click to parent.
   */
  onSlotClick(date: Date): void {
    this.slotClick.emit(date);
  }

  /**
   * Forwards date selection to parent.
   */
  onDateSelect(date: Date): void {
    this.dateSelect.emit(date);
  }
}
