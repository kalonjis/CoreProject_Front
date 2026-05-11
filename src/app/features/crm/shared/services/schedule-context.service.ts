import { Injectable, signal } from '@angular/core';

/**
 * Shared signal bridge between Schedule modals and the AgendaDayPanelComponent.
 *
 * A Schedule modal sets isOpen + activeDate on mount/unmount and whenever
 * the user edits the date field. The panel reacts to these signals to
 * fetch and display the day's agenda.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleContextService {
  /** Whether a Schedule modal is currently mounted. */
  readonly isOpen = signal(false);
  /** The selected date in YYYY-MM-DD format; null when no date is chosen. */
  readonly activeDate = signal<string | null>(null);
}
