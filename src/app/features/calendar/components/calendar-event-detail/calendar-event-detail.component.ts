import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
  signal, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  CalendarEvent,
  CalendarEventStatus,
  EventRecurrence,
  CALENDAR_EVENT_STATUS_LABELS,
  EVENT_RECURRENCE_LABELS
} from '../../models';
import { CALENDAR_CONFIG } from '../../calendar.config';
import { CalendarExportApiService } from '../../services';
import { getContrastColor } from '../../utils';
import {
  EventStatusPipe,
  EventStatusColorPipe,
  EventRecurrencePipe,
  DateRangePipe
} from '../../pipes';
import {ActivatedRoute, Router} from '@angular/router';

/**
 * Calendar event detail component.
 *
 * @description
 * Displays full details of a calendar event in a panel/modal.
 * Provides actions to edit, delete, or export the event.
 *
 * @example
 * ```html
 * <app-calendar-event-detail
 *   [event]="selectedEvent"
 *   (close)="onDetailClose()"
 *   (edit)="onEditEvent($event)"
 *   (delete)="onDeleteEvent($event)"
 * />
 * ```
 */
@Component({
    selector: 'app-calendar-event-detail',
    imports: [
        CommonModule,
        EventStatusPipe,
        EventStatusColorPipe,
        EventRecurrencePipe,
        DateRangePipe
    ],
    templateUrl: './calendar-event-detail.component.html',
    styleUrl: './calendar-event-detail.component.scss'
})
export class CalendarEventDetailComponent implements OnInit {
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  private readonly config = inject(CALENDAR_CONFIG);
  private readonly exportService = inject(CalendarExportApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** The event to display (when used as child component) */
  @Input()
  set event(value: CalendarEvent) {
    this._event.set(value);
  }
  private readonly _event = signal<CalendarEvent | null>(null);


  // ===========================================================================
  // Outputs
  // ===========================================================================

  /** Emits when close button is clicked */
  @Output() close = new EventEmitter<void>();

  /** Emits when edit button is clicked */
  @Output() edit = new EventEmitter<CalendarEvent>();

  /** Emits when delete button is clicked */
  @Output() delete = new EventEmitter<CalendarEvent>();

  // ===========================================================================
  // Local State
  // ===========================================================================

  /** Whether export menu is open */
  readonly exportMenuOpen = signal<boolean>(false);

  // ===========================================================================
  // Computed State
  // ===========================================================================

  readonly event$ = this._event.asReadonly();

  /** Formatted date range */
  readonly dateRange = computed(() => {
    const event = this._event();
    if (!event) return '';

    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    if (event.allDay) {
      return new Intl.DateTimeFormat(this.config.locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(start);
    }

    const sameDay =
      start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();

    if (sameDay) {
      const dateStr = new Intl.DateTimeFormat(this.config.locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(start);

      const timeStart = start.toLocaleTimeString(this.config.locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
      const timeEnd = end.toLocaleTimeString(this.config.locale, {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `${dateStr}\n${timeStart} - ${timeEnd}`;
    }

    // Multi-day event
    const formatDateTime = (d: Date) =>
      new Intl.DateTimeFormat(this.config.locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);

    return `${formatDateTime(start)} → ${formatDateTime(end)}`;
  });

  /** Event color */
  readonly eventColor = computed(() => this._event()?.colorCode || '#3b82f6');

  /** Text color for contrast */
  readonly textColor = computed(() => getContrastColor(this.eventColor()));

  /** Whether event is cancelled */
  readonly isCancelled = computed(
    () => this._event()?.status === CalendarEventStatus.CANCELLED
  );

  /** Whether event is recurring */
  readonly isRecurring = computed(
    () => this._event()?.recurrence !== EventRecurrence.NONE
  );

  /** Recurrence description */
  readonly recurrenceLabel = computed(() => {
    const event = this._event();
    if (!event || event.recurrence === EventRecurrence.NONE) return '';
    return EVENT_RECURRENCE_LABELS[event.recurrence];
  });

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  ngOnInit(): void {
    // Si pas d'event en @Input, essayer de le récupérer depuis le resolver
    if (!this._event()) {
      const resolvedEvent = this.route.snapshot.data['event'] as CalendarEvent | null;
      if (resolvedEvent) {
        this._event.set(resolvedEvent);
      }
    }
  }



  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  readonly CalendarEventStatus = CalendarEventStatus;

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Handles close button click.
   */
  onClose(): void {
    this.close.emit();
    // Si utilisé comme page routable, naviguer vers le calendrier
    if (this.route.snapshot.data['event']) {
      this.router.navigate(['/calendar']);
    }
  }

  /**
   * Handles edit button click.
   */
  onEdit(): void {
    const event = this._event();
    if (event) {
      this.edit.emit(event);
    }
  }

  /**
   * Handles delete button click.
   */
  onDelete(): void {
    const event = this._event();
    if (event) {
      this.delete.emit(event);
    }
  }

  /**
   * Toggles export menu.
   */
  toggleExportMenu(): void {
    this.exportMenuOpen.update(open => !open);
  }

  /**
   * Exports to Google Calendar.
   */
  exportToGoogle(): void {
    const event = this._event();
    if (event) {
      this.exportService.openInGoogleCalendar(event.publicId);
      this.exportMenuOpen.set(false);
    }
  }

  /**
   * Exports to Outlook.
   */
  exportToOutlook(): void {
    const event = this._event();
    if (event) {
      this.exportService.openInOutlook(event.publicId);
      this.exportMenuOpen.set(false);
    }
  }

  /**
   * Downloads ICS file.
   */
  downloadIcs(): void {
    const event = this._event();
    if (event) {
      this.exportService.downloadEventIcs(event.publicId, event.title);
      this.exportMenuOpen.set(false);
    }
  }
}
