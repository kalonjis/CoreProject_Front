import { Component, inject, signal, computed, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ScheduleContextService } from '../../services/schedule-context.service';
import { CrmCommercialActionApiService } from '../../../domains/commercial-action/services/crm-commercial-action-api.service';
import {
  CommercialActionResponse,
  CommercialActionStatus,
  CommercialActionType,
  COMMERCIAL_ACTION_TYPE_LABELS
} from '../../../domains/commercial-action/models/commercial-action.model';
import { CalendarEventApiService } from '../../../../calendar/services/calendar-event-api.service';
import { CalendarEvent } from '../../../../calendar/models/calendar-event.model';
import { QueryParamsUtils } from '../../../../calendar/models/calendar-query-params.model';

/** Unified item for the agenda timeline — wraps either source. */
export interface AgendaItem {
  publicId:    string;
  title:       string;
  timeIso:     string;
  color:       string;
  typeLabel:   string;
  location:    string | null;
  description: string | null;
  assignee:    string | null;
  duration:    number | null;
  source:      'crm' | 'calendar';
}

const CRM_TYPE_COLORS: Record<CommercialActionType, string> = {
  [CommercialActionType.MEETING]: '#16a34a',
  [CommercialActionType.DEMO]:    '#7c3aed',
  [CommercialActionType.CALL]:    '#2563eb',
  [CommercialActionType.EMAIL]:   '#d97706',
  [CommercialActionType.TASK]:    '#475569',
};

/**
 * Fixed right-side panel that appears when a Schedule modal is open and a date is selected.
 *
 * Aggregates both CRM commercial actions and personal calendar events for the day,
 * sorted by start time, using the agenda-block visual pattern.
 */
@Component({
  selector: 'app-agenda-day-panel',
  imports: [DatePipe],
  templateUrl: './agenda-day-panel.component.html',
  styleUrl:    './agenda-day-panel.component.scss'
})
export class AgendaDayPanelComponent {

  private readonly ctx         = inject(ScheduleContextService);
  private readonly crmApi      = inject(CrmCommercialActionApiService);
  private readonly calendarApi = inject(CalendarEventApiService);

  /** Whether the panel should be visible and slide in. */
  readonly visible = computed(() => this.ctx.isOpen() && this.ctx.activeDate() !== null);

  readonly activeDate  = this.ctx.activeDate;
  readonly loading     = signal(false);
  readonly items       = signal<AgendaItem[]>([]);
  readonly expandedId  = signal<string | null>(null);

  constructor() {
    effect(() => {
      const date = this.ctx.activeDate();
      if (!date || !this.ctx.isOpen()) {
        this.items.set([]);
        this.expandedId.set(null);
        return;
      }
      this.fetchForDate(date);
    });
  }

  private fetchForDate(dateStr: string): void {
    this.loading.set(true);
    this.expandedId.set(null);

    const range = QueryParamsUtils.forDay(new Date(dateStr));

    forkJoin({
      crm:      this.crmApi.getMyActions(CommercialActionStatus.PENDING).pipe(
                  catchError(() => of([] as CommercialActionResponse[]))
                ),
      calendar: this.calendarApi.getEventsInRange(range).pipe(
                  catchError(() => of([] as CalendarEvent[]))
                )
    }).subscribe({
      next: ({ crm, calendar }) => {
        const crmItems = crm
          .filter(a => a.dueDate && a.dueDate.slice(0, 10) === dateStr)
          .map(a => this.fromCrm(a));

        const calItems = calendar
          .filter(e => e.sourceType !== 'COMMERCIAL_ACTION')
          .map(e => this.fromCalendar(e));

        const merged = [...crmItems, ...calItems]
          .sort((a, b) => a.timeIso.localeCompare(b.timeIso));

        this.items.set(merged);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private fromCrm(a: CommercialActionResponse): AgendaItem {
    return {
      publicId:    a.publicId,
      title:       a.title,
      timeIso:     a.dueDate!,
      color:       CRM_TYPE_COLORS[a.type] ?? '#475569',
      typeLabel:   COMMERCIAL_ACTION_TYPE_LABELS[a.type],
      location:    a.location,
      description: a.description,
      assignee:    a.assignedToUsername,
      duration:    a.durationMinutes,
      source:      'crm'
    };
  }

  private fromCalendar(e: CalendarEvent): AgendaItem {
    const durationMs = e.allDay
      ? null
      : new Date(e.endDateTime).getTime() - new Date(e.startDateTime).getTime();
    return {
      publicId:    e.publicId,
      title:       e.title,
      timeIso:     e.startDateTime,
      color:       e.colorCode ?? '#3b82f6',
      typeLabel:   e.allDay ? 'Toute la journée' : 'Événement',
      location:    e.displayLocation ?? e.location,
      description: e.description,
      assignee:    null,
      duration:    durationMs !== null ? Math.round(durationMs / 60000) : null,
      source:      'calendar'
    };
  }

  /** Toggles the expanded detail section for a given item. */
  toggle(publicId: string): void {
    this.expandedId.set(this.expandedId() === publicId ? null : publicId);
  }

  /** Formats a duration in minutes as "1h30" or "45 min". */
  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`;
  }
}
