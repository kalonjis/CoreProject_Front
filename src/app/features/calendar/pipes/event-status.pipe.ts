import { Pipe, PipeTransform } from '@angular/core';
import {
  CalendarEventStatus,
  CALENDAR_EVENT_STATUS_LABELS
} from '../models';

/**
 * Pipe that transforms a CalendarEventStatus enum to its display label.
 *
 * @description
 * Converts the enum value to a localized, human-readable string.
 * Returns the raw value if not found in the labels map.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <span>{{ event.status | eventStatus }}</span>
 * <!-- Output: "Confirmé" -->
 *
 * <!-- With badge styling -->
 * <span class="badge" [ngClass]="event.status | eventStatusClass">
 *   {{ event.status | eventStatus }}
 * </span>
 * ```
 *
 * @example
 * ```typescript
 * // In component
 * import { EventStatusPipe } from '@features/calendar/pipes';
 *
 * @Component({
 *   imports: [EventStatusPipe]
 * })
 * export class EventComponent {
 *   private statusPipe = new EventStatusPipe();
 *
 *   getStatusLabel(status: CalendarEventStatus): string {
 *     return this.statusPipe.transform(status);
 *   }
 * }
 * ```
 */
@Pipe({
  name: 'eventStatus',
  standalone: true,
  pure: true
})
export class EventStatusPipe implements PipeTransform {
  /**
   * Transforms a status enum value to its display label.
   *
   * @param value - CalendarEventStatus enum value
   * @returns Localized display label
   */
  transform(value: CalendarEventStatus | null | undefined): string {
    if (!value) {
      return '';
    }

    return CALENDAR_EVENT_STATUS_LABELS[value] || value;
  }
}

/**
 * Pipe that returns CSS class(es) for a status value.
 *
 * @description
 * Useful for applying status-specific styling to badges,
 * icons, or other visual elements.
 *
 * @example
 * ```html
 * <span [ngClass]="event.status | eventStatusClass">
 *   {{ event.status | eventStatus }}
 * </span>
 *
 * <!-- With prefix for custom classes -->
 * <span [ngClass]="event.status | eventStatusClass:'badge-'">
 *   {{ event.status | eventStatus }}
 * </span>
 * <!-- Output class: "badge-confirmed" -->
 * ```
 */
@Pipe({
  name: 'eventStatusClass',
  standalone: true,
  pure: true
})
export class EventStatusClassPipe implements PipeTransform {
  /**
   * Maps status to CSS class names.
   */
  private readonly classMap: Record<CalendarEventStatus, string> = {
    [CalendarEventStatus.TENTATIVE]: 'tentative',
    [CalendarEventStatus.CONFIRMED]: 'confirmed',
    [CalendarEventStatus.CANCELLED]: 'cancelled'
  };

  /**
   * Transforms a status to CSS class name(s).
   *
   * @param value - CalendarEventStatus enum value
   * @param prefix - Optional prefix for the class name
   * @returns CSS class name string
   */
  transform(
    value: CalendarEventStatus | null | undefined,
    prefix: string = 'status-'
  ): string {
    if (!value) {
      return '';
    }

    const baseClass = this.classMap[value] || value.toLowerCase();
    return `${prefix}${baseClass}`;
  }
}

/**
 * Pipe that returns an icon name for a status value.
 *
 * @description
 * Returns an icon identifier that can be used with icon libraries
 * like Material Icons, FontAwesome, or Lucide.
 *
 * @example
 * ```html
 * <lucide-icon [name]="event.status | eventStatusIcon"></lucide-icon>
 *
 * <mat-icon>{{ event.status | eventStatusIcon }}</mat-icon>
 * ```
 */
@Pipe({
  name: 'eventStatusIcon',
  standalone: true,
  pure: true
})
export class EventStatusIconPipe implements PipeTransform {
  /**
   * Maps status to icon names.
   */
  private readonly iconMap: Record<CalendarEventStatus, string> = {
    [CalendarEventStatus.TENTATIVE]: 'help-circle',
    [CalendarEventStatus.CONFIRMED]: 'check-circle',
    [CalendarEventStatus.CANCELLED]: 'x-circle'
  };

  /**
   * Transforms a status to icon name.
   *
   * @param value - CalendarEventStatus enum value
   * @returns Icon name string
   */
  transform(value: CalendarEventStatus | null | undefined): string {
    if (!value) {
      return 'calendar';
    }

    return this.iconMap[value] || 'calendar';
  }
}

/**
 * Pipe that returns a color for a status value.
 *
 * @description
 * Returns a color code that can be used for styling status indicators.
 * Colors follow common conventions (green=confirmed, yellow=tentative, red=cancelled).
 *
 * @example
 * ```html
 * <span [style.color]="event.status | eventStatusColor">
 *   {{ event.status | eventStatus }}
 * </span>
 *
 * <div [style.background-color]="event.status | eventStatusColor:'bg'">
 *   ...
 * </div>
 * ```
 */
@Pipe({
  name: 'eventStatusColor',
  standalone: true,
  pure: true
})
export class EventStatusColorPipe implements PipeTransform {
  /**
   * Maps status to foreground colors.
   */
  private readonly colorMap: Record<CalendarEventStatus, string> = {
    [CalendarEventStatus.TENTATIVE]: '#F59E0B',  // Amber
    [CalendarEventStatus.CONFIRMED]: '#10B981',  // Green
    [CalendarEventStatus.CANCELLED]: '#EF4444'   // Red
  };

  /**
   * Maps status to background colors (lighter variants).
   */
  private readonly bgColorMap: Record<CalendarEventStatus, string> = {
    [CalendarEventStatus.TENTATIVE]: '#FEF3C7',  // Amber-100
    [CalendarEventStatus.CONFIRMED]: '#D1FAE5',  // Green-100
    [CalendarEventStatus.CANCELLED]: '#FEE2E2'   // Red-100
  };

  /**
   * Transforms a status to color code.
   *
   * @param value - CalendarEventStatus enum value
   * @param type - 'fg' for foreground or 'bg' for background
   * @returns Hex color code
   */
  transform(
    value: CalendarEventStatus | null | undefined,
    type: 'fg' | 'bg' = 'fg'
  ): string {
    if (!value) {
      return '#6B7280'; // Gray
    }

    const map = type === 'bg' ? this.bgColorMap : this.colorMap;
    return map[value] || '#6B7280';
  }
}
