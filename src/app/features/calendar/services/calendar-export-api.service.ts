import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  CalendarUrlsResponse,
  ExternalCalendarProvider,
  CalendarExportOptions
} from '../models';

/**
 * Service for calendar export operations.
 *
 * @description
 * Handles exporting calendar events to external formats and services:
 * - ICS file download (single event or all events)
 * - Google Calendar URL generation
 * - Outlook Web URL generation
 *
 * URLs are generated server-side to ensure consistency and security.
 *
 * @example
 * ```typescript
 * export class ExportModalComponent {
 *   private exportService = inject(CalendarExportApiService);
 *
 *   exportToGoogle(eventId: string): void {
 *     this.exportService.getCalendarUrls(eventId).subscribe(urls => {
 *       window.open(urls.googleCalendarUrl, '_blank');
 *     });
 *   }
 *
 *   downloadIcs(eventId: string): void {
 *     this.exportService.downloadEventIcs(eventId);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarExportApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/calendar';

  // ===========================================================================
  // URL Generation
  // ===========================================================================

  /**
   * Gets external calendar URLs for a specific event.
   *
   * @param publicId - Event public ID
   * @returns Observable containing Google Calendar and Outlook URLs
   *
   * @example
   * ```typescript
   * this.exportService.getCalendarUrls('550e8400...')
   *   .subscribe(urls => {
   *     console.log('Google URL:', urls.googleCalendarUrl);
   *     console.log('Outlook URL:', urls.outlookWebUrl);
   *   });
   * ```
   */
  getCalendarUrls(publicId: string): Observable<CalendarUrlsResponse> {
    return this.http.get<CalendarUrlsResponse>(
      `${this.baseUrl}/events/${publicId}/urls`
    );
  }

  /**
   * Opens an event in Google Calendar (new browser tab).
   *
   * @param publicId - Event public ID
   *
   * @example
   * ```typescript
   * this.exportService.openInGoogleCalendar('550e8400...');
   * ```
   */
  openInGoogleCalendar(publicId: string): void {
    this.getCalendarUrls(publicId)
      .pipe(
        tap(urls => window.open(urls.googleCalendarUrl, '_blank'))
      )
      .subscribe();
  }

  /**
   * Opens an event in Outlook Web (new browser tab).
   *
   * @param publicId - Event public ID
   *
   * @example
   * ```typescript
   * this.exportService.openInOutlook('550e8400...');
   * ```
   */
  openInOutlook(publicId: string): void {
    this.getCalendarUrls(publicId)
      .pipe(
        tap(urls => window.open(urls.outlookWebUrl, '_blank'))
      )
      .subscribe();
  }

  // ===========================================================================
  // ICS File Download
  // ===========================================================================

  /**
   * Downloads a single event as an ICS file.
   *
   * @param publicId - Event public ID
   * @param filename - Optional custom filename (without extension)
   *
   * @example
   * ```typescript
   * this.exportService.downloadEventIcs('550e8400...', 'team-meeting');
   * ```
   */
  downloadEventIcs(publicId: string, filename?: string): void {
    this.http
      .get(`${this.baseUrl}/events/${publicId}/export`, {
        responseType: 'blob'
      })
      .pipe(
        tap(blob => this.triggerDownload(blob, filename || `event-${publicId}`))
      )
      .subscribe();
  }

  /**
   * Downloads all user events as a single ICS file.
   *
   * @param filename - Optional custom filename (without extension)
   *
   * @example
   * ```typescript
   * this.exportService.downloadAllEventsIcs('my-calendar-backup');
   * ```
   */
  downloadAllEventsIcs(filename?: string): void {
    this.http
      .get(`${this.baseUrl}/export-all`, {
        responseType: 'blob'
      })
      .pipe(
        tap(blob => this.triggerDownload(blob, filename || 'my-events'))
      )
      .subscribe();
  }

  /**
   * Gets the raw ICS content for a single event (without download).
   *
   * @param publicId - Event public ID
   * @returns Observable of ICS content as string
   *
   * @example
   * ```typescript
   * this.exportService.getEventIcsContent('550e8400...')
   *   .subscribe(icsContent => {
   *     // Copy to clipboard, display preview, etc.
   *     console.log(icsContent);
   *   });
   * ```
   */
  getEventIcsContent(publicId: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/events/${publicId}/export`, {
      responseType: 'text'
    });
  }

  // ===========================================================================
  // Unified Export Method
  // ===========================================================================

  /**
   * Exports event(s) based on the provided options.
   *
   * @param options - Export configuration
   *
   * @example
   * ```typescript
   * // Export single event to Google Calendar
   * this.exportService.export({
   *   provider: ExternalCalendarProvider.GOOGLE,
   *   exportAll: false,
   *   eventPublicId: '550e8400...'
   * });
   *
   * // Export all events as ICS
   * this.exportService.export({
   *   provider: ExternalCalendarProvider.ICS,
   *   exportAll: true
   * });
   * ```
   */
  export(options: CalendarExportOptions): void {
    const { provider, exportAll, eventPublicId } = options;

    if (exportAll && provider === ExternalCalendarProvider.ICS) {
      this.downloadAllEventsIcs();
      return;
    }

    if (!eventPublicId) {
      console.error('Event public ID is required for single event export');
      return;
    }

    switch (provider) {
      case ExternalCalendarProvider.GOOGLE:
        this.openInGoogleCalendar(eventPublicId);
        break;

      case ExternalCalendarProvider.OUTLOOK:
        this.openInOutlook(eventPublicId);
        break;

      case ExternalCalendarProvider.ICS:
      case ExternalCalendarProvider.APPLE:
        // Apple Calendar uses ICS files
        this.downloadEventIcs(eventPublicId);
        break;

      default:
        console.error('Unsupported export provider:', provider);
    }
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Triggers a file download in the browser.
   *
   * @param blob - File content as Blob
   * @param filename - Filename without extension
   */
  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${this.sanitizeFilename(filename)}.ics`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Sanitizes filename by removing unsafe characters.
   *
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  }
}
