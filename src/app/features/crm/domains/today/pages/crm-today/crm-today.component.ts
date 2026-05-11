/**
 * "Today" dashboard page for the CRM.
 *
 * Displays a prioritised daily work list: overdue commercial actions, today's actions,
 * overdue deals, deals closing soon, and open support tickets.
 * Each item links to its corresponding detail page.
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CrmTodayApiService } from '../../services/crm-today-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { TodaySummary } from '../../models/today.model';
import { CommercialActionResponse, COMMERCIAL_ACTION_TYPE_LABELS, COMMERCIAL_ACTION_PRIORITY_LABELS } from '../../../commercial-action/models/commercial-action.model';
import { DealSummary } from '../../../deal/models/deal.model';
import { SupportTicketSummary, SUPPORT_TICKET_STATUS_LABELS } from '../../../support-ticket/models/support-ticket.model';

@Component({
  selector: 'app-crm-today',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './crm-today.component.html',
  styleUrl: './crm-today.component.scss'
})
export class CrmTodayComponent implements OnInit {

  private readonly api      = inject(CrmTodayApiService);
  private readonly router   = inject(Router);
  private readonly feedback = inject(FeedbackService);

  /** Date used to display "today" in the template header. */
  readonly today   = new Date();
  /** Whether the summary is being fetched. */
  readonly loading = signal(false);
  /** Today's work summary from the API; null while loading. */
  readonly summary = signal<TodaySummary | null>(null);

  readonly ACTION_TYPE_LABELS     = COMMERCIAL_ACTION_TYPE_LABELS;
  readonly ACTION_PRIORITY_LABELS = COMMERCIAL_ACTION_PRIORITY_LABELS;
  readonly TICKET_STATUS_LABELS   = SUPPORT_TICKET_STATUS_LABELS;

  /** Total number of items across all sections (used for the empty-state check). */
  readonly totalItems = computed(() => {
    const s = this.summary();
    if (!s) return 0;
    return s.overdueActions.length + s.todayActions.length +
           s.dealsOverdue.length + s.dealsClosingSoon.length + s.openTickets.length;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.getSummary().subscribe({
      next:  s  => { this.summary.set(s); this.loading.set(false); },
      error: () => { this.feedback.showError('Impossible de charger le résumé du jour.'); this.loading.set(false); }
    });
  }

  /** Navigates to the detail page for the given commercial action. */
  goAction(action: CommercialActionResponse): void {
    this.router.navigate(['/crm/commercial-actions', action.publicId]);
  }

  /** Navigates to the detail page for the given deal. */
  goDeal(deal: DealSummary): void {
    this.router.navigate(['/crm/deals', deal.publicId]);
  }

  /** Navigates to the detail page for the given support ticket. */
  goTicket(ticket: SupportTicketSummary): void {
    this.router.navigate(['/crm/support-tickets', ticket.publicId]);
  }
}
