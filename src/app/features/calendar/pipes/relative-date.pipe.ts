import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe that formats a date as a relative time string.
 *
 * @description
 * Converts dates to human-readable relative strings like "Aujourd'hui",
 * "Demain", "Dans 3 jours", "Il y a 2 semaines", etc.
 *
 * Supports both Date objects and ISO string inputs.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <span>{{ event.startDateTime | relativeDate }}</span>
 * <!-- Output: "Demain" or "Dans 3 jours" -->
 *
 * <!-- With fallback format for distant dates -->
 * <span>{{ event.startDateTime | relativeDate:'long' }}</span>
 * <!-- Output: "15 février 2025" for dates > 7 days away -->
 *
 * <!-- Include time for today/tomorrow -->
 * <span>{{ event.startDateTime | relativeDate:'short':true }}</span>
 * <!-- Output: "Demain à 14:30" -->
 * ```
 */
@Pipe({
  name: 'relativeDate',
  standalone: true,
  pure: true
})
export class RelativeDatePipe implements PipeTransform {
  /**
   * Transforms a date to relative time string.
   *
   * @param value - Date object or ISO string
   * @param fallbackFormat - Format for distant dates ('short' | 'long')
   * @param includeTime - Whether to include time for today/tomorrow
   * @returns Relative date string
   */
  transform(
    value: Date | string | null | undefined,
    fallbackFormat: 'short' | 'long' = 'short',
    includeTime: boolean = false
  ): string {
    if (!value) {
      return '';
    }

    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffDays = this.getDaysDiff(now, date);
    const timeStr = includeTime ? ` à ${this.formatTime(date)}` : '';

    // Today
    if (diffDays === 0) {
      return includeTime ? `Aujourd'hui${timeStr}` : "Aujourd'hui";
    }

    // Tomorrow
    if (diffDays === 1) {
      return includeTime ? `Demain${timeStr}` : 'Demain';
    }

    // Yesterday
    if (diffDays === -1) {
      return 'Hier';
    }

    // Within next 7 days
    if (diffDays > 1 && diffDays <= 7) {
      return `Dans ${diffDays} jours`;
    }

    // Within past 7 days
    if (diffDays < -1 && diffDays >= -7) {
      return `Il y a ${Math.abs(diffDays)} jours`;
    }

    // Within next 4 weeks
    if (diffDays > 7 && diffDays <= 28) {
      const weeks = Math.ceil(diffDays / 7);
      return weeks === 1 ? 'Dans 1 semaine' : `Dans ${weeks} semaines`;
    }

    // Within past 4 weeks
    if (diffDays < -7 && diffDays >= -28) {
      const weeks = Math.ceil(Math.abs(diffDays) / 7);
      return weeks === 1 ? 'Il y a 1 semaine' : `Il y a ${weeks} semaines`;
    }

    // Fallback to formatted date
    return this.formatDate(date, fallbackFormat);
  }

  /**
   * Calculates the difference in days between two dates.
   */
  private getDaysDiff(from: Date, to: Date): number {
    const fromStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const toStart = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    const diffMs = toStart.getTime() - fromStart.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Formats time as HH:mm.
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-BE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Formats date according to specified format.
   */
  private formatDate(date: Date, format: 'short' | 'long'): string {
    const options: Intl.DateTimeFormatOptions = format === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short' };

    return date.toLocaleDateString('fr-BE', options);
  }
}

/**
 * Pipe that formats a date relative to event timing.
 *
 * @description
 * Specialized for calendar events - shows "En cours" for ongoing events,
 * "Terminé" for past events, and relative time for upcoming events.
 *
 * @example
 * ```html
 * <span class="event-timing">
 *   {{ event | eventTiming }}
 * </span>
 * <!-- Output: "En cours", "Commence dans 2h", "Terminé" -->
 * ```
 */
@Pipe({
  name: 'eventTiming',
  standalone: true,
  pure: true
})
export class EventTimingPipe implements PipeTransform {
  /**
   * Transforms event dates to timing description.
   *
   * @param event - Object with startDateTime and endDateTime
   * @returns Timing description string
   */
  transform(
    event: { startDateTime: string; endDateTime: string } | null | undefined
  ): string {
    if (!event) {
      return '';
    }

    const now = new Date();
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    // Event is ongoing
    if (now >= start && now <= end) {
      return 'En cours';
    }

    // Event has ended
    if (now > end) {
      return 'Terminé';
    }

    // Event is upcoming
    const diffMs = start.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Commence maintenant' : `Commence dans ${diffMinutes} min`;
    }

    if (diffHours < 24) {
      return diffHours === 1 ? 'Commence dans 1h' : `Commence dans ${diffHours}h`;
    }

    if (diffDays === 1) {
      return 'Demain';
    }

    if (diffDays <= 7) {
      return `Dans ${diffDays} jours`;
    }

    // Fallback to date
    return start.toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'short'
    });
  }
}

/**
 * Pipe that formats a date range for display.
 *
 * @description
 * Formats start and end dates as a range string, intelligently
 * handling same-day events and multi-day events.
 *
 * @example
 * ```html
 * <!-- Same day event -->
 * <span>{{ event | dateRange }}</span>
 * <!-- Output: "10 février, 14:00 - 15:00" -->
 *
 * <!-- Multi-day event -->
 * <span>{{ event | dateRange }}</span>
 * <!-- Output: "10 - 12 février 2025" -->
 *
 * <!-- All-day event -->
 * <span>{{ event | dateRange:true }}</span>
 * <!-- Output: "10 février 2025" -->
 * ```
 */
@Pipe({
  name: 'dateRange',
  standalone: true,
  pure: true
})
export class DateRangePipe implements PipeTransform {
  /**
   * Transforms event to formatted date range string.
   *
   * @param event - Object with startDateTime, endDateTime, and optional allDay
   * @param allDay - Override for all-day flag
   * @returns Formatted date range string
   */
  transform(
    event: { startDateTime: string; endDateTime: string; allDay?: boolean } | null | undefined,
    allDay?: boolean
  ): string {
    if (!event) {
      return '';
    }

    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    const isAllDay = allDay ?? event.allDay ?? false;
    const sameDay = this.isSameDay(start, end);

    // All-day event
    if (isAllDay) {
      if (sameDay) {
        return this.formatDate(start, 'long');
      }
      return `${this.formatDate(start, 'short')} - ${this.formatDate(end, 'long')}`;
    }

    // Same day with times
    if (sameDay) {
      const dateStr = this.formatDate(start, 'long');
      const startTime = this.formatTime(start);
      const endTime = this.formatTime(end);
      return `${dateStr}, ${startTime} - ${endTime}`;
    }

    // Multi-day event
    return `${this.formatDateTime(start)} - ${this.formatDateTime(end)}`;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private formatDate(date: Date, format: 'short' | 'long'): string {
    const options: Intl.DateTimeFormatOptions = format === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'long' };
    return date.toLocaleDateString('fr-BE', options);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-BE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
