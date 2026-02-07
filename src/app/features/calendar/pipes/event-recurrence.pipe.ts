import { Pipe, PipeTransform } from '@angular/core';
import {
  EventRecurrence,
  EVENT_RECURRENCE_LABELS
} from '../models';

/**
 * Pipe that transforms an EventRecurrence enum to its display label.
 *
 * @description
 * Converts the enum value to a localized, human-readable string.
 * Returns empty string for NONE recurrence by default.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <span>{{ event.recurrence | eventRecurrence }}</span>
 * <!-- Output: "Hebdomadaire" -->
 *
 * <!-- Show label even for NONE -->
 * <span>{{ event.recurrence | eventRecurrence:true }}</span>
 * <!-- Output: "Aucune" -->
 * ```
 */
@Pipe({
  name: 'eventRecurrence',
  standalone: true,
  pure: true
})
export class EventRecurrencePipe implements PipeTransform {
  /**
   * Transforms a recurrence enum value to its display label.
   *
   * @param value - EventRecurrence enum value
   * @param showNone - Whether to show label for NONE (default: false)
   * @returns Localized display label
   */
  transform(
    value: EventRecurrence | null | undefined,
    showNone: boolean = false
  ): string {
    if (!value) {
      return '';
    }

    // Hide NONE unless explicitly requested
    if (value === EventRecurrence.NONE && !showNone) {
      return '';
    }

    return EVENT_RECURRENCE_LABELS[value] || value;
  }
}

/**
 * Pipe that returns an icon name for a recurrence value.
 *
 * @description
 * Returns an icon identifier for visual representation of the recurrence pattern.
 *
 * @example
 * ```html
 * <lucide-icon [name]="event.recurrence | eventRecurrenceIcon"></lucide-icon>
 *
 * <!-- Only show icon if recurring -->
 * @if (event.recurrence !== EventRecurrence.NONE) {
 *   <lucide-icon [name]="event.recurrence | eventRecurrenceIcon"></lucide-icon>
 * }
 * ```
 */
@Pipe({
  name: 'eventRecurrenceIcon',
  standalone: true,
  pure: true
})
export class EventRecurrenceIconPipe implements PipeTransform {
  /**
   * Maps recurrence to icon names.
   */
  private readonly iconMap: Record<EventRecurrence, string> = {
    [EventRecurrence.NONE]: 'calendar',
    [EventRecurrence.DAILY]: 'repeat',
    [EventRecurrence.WEEKLY]: 'calendar-days',
    [EventRecurrence.MONTHLY]: 'calendar-range',
    [EventRecurrence.YEARLY]: 'calendar-clock'
  };

  /**
   * Transforms a recurrence to icon name.
   *
   * @param value - EventRecurrence enum value
   * @returns Icon name string
   */
  transform(value: EventRecurrence | null | undefined): string {
    if (!value) {
      return 'calendar';
    }

    return this.iconMap[value] || 'calendar';
  }
}

/**
 * Pipe that returns a human-readable description of the recurrence pattern.
 *
 * @description
 * Generates a descriptive sentence explaining when the event repeats.
 * Useful for tooltips or detail views.
 *
 * @example
 * ```html
 * <span [title]="event.recurrence | eventRecurrenceDescription">
 *   {{ event.recurrence | eventRecurrence }}
 * </span>
 * <!-- Tooltip: "Se répète chaque semaine" -->
 *
 * <!-- With start date for more context -->
 * <p>{{ event.recurrence | eventRecurrenceDescription:event.startDateTime }}</p>
 * <!-- Output: "Se répète chaque lundi" -->
 * ```
 */
@Pipe({
  name: 'eventRecurrenceDescription',
  standalone: true,
  pure: true
})
export class EventRecurrenceDescriptionPipe implements PipeTransform {
  /**
   * Day names in French.
   */
  private readonly dayNames = [
    'dimanche', 'lundi', 'mardi', 'mercredi',
    'jeudi', 'vendredi', 'samedi'
  ];

  /**
   * Transforms a recurrence to descriptive text.
   *
   * @param value - EventRecurrence enum value
   * @param startDateTime - Optional start date for context
   * @returns Descriptive sentence
   */
  transform(
    value: EventRecurrence | null | undefined,
    startDateTime?: string
  ): string {
    if (!value || value === EventRecurrence.NONE) {
      return 'Événement unique';
    }

    const startDate = startDateTime ? new Date(startDateTime) : null;

    switch (value) {
      case EventRecurrence.DAILY:
        return 'Se répète chaque jour';

      case EventRecurrence.WEEKLY:
        if (startDate) {
          const dayName = this.dayNames[startDate.getDay()];
          return `Se répète chaque ${dayName}`;
        }
        return 'Se répète chaque semaine';

      case EventRecurrence.MONTHLY:
        if (startDate) {
          const dayOfMonth = startDate.getDate();
          return `Se répète le ${dayOfMonth} de chaque mois`;
        }
        return 'Se répète chaque mois';

      case EventRecurrence.YEARLY:
        if (startDate) {
          const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long'
          };
          const dateStr = startDate.toLocaleDateString('fr-BE', options);
          return `Se répète chaque année le ${dateStr}`;
        }
        return 'Se répète chaque année';

      default:
        return '';
    }
  }
}

/**
 * Pipe that checks if a recurrence represents a recurring event.
 *
 * @description
 * Returns true for any recurrence pattern except NONE.
 * Useful for conditional rendering.
 *
 * @example
 * ```html
 * @if (event.recurrence | isRecurring) {
 *   <lucide-icon name="repeat"></lucide-icon>
 *   <span>{{ event.recurrence | eventRecurrence }}</span>
 * }
 * ```
 */
@Pipe({
  name: 'isRecurring',
  standalone: true,
  pure: true
})
export class IsRecurringPipe implements PipeTransform {
  /**
   * Checks if the recurrence represents a recurring event.
   *
   * @param value - EventRecurrence enum value
   * @returns True if recurring, false otherwise
   */
  transform(value: EventRecurrence | null | undefined): boolean {
    return !!value && value !== EventRecurrence.NONE;
  }
}
