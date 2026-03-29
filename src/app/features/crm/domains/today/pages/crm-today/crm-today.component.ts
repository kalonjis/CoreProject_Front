import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { CrmTodayApiService } from '../../services/crm-today-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { TodaySummary } from '../../models/today.model';
import { CommercialActionResponse, COMMERCIAL_ACTION_TYPE_LABELS, COMMERCIAL_ACTION_PRIORITY_LABELS } from '../../../commercial-action/models/commercial-action.model';
import { DealSummary } from '../../../deal/models/deal.model';
import { SupportTicketSummary, SUPPORT_TICKET_STATUS_LABELS } from '../../../support-ticket/models/support-ticket.model';

@Component({
  selector: 'app-crm-today',
  imports: [DatePipe, CurrencyPipe, DecimalPipe],
  templateUrl: './crm-today.component.html',
  styleUrl: './crm-today.component.scss'
})
export class CrmTodayComponent implements OnInit {

  private readonly api      = inject(CrmTodayApiService);
  private readonly router   = inject(Router);
  private readonly feedback = inject(FeedbackService);

  readonly today   = new Date();
  readonly loading = signal(false);
  readonly summary = signal<TodaySummary | null>(null);

  readonly ACTION_TYPE_LABELS     = COMMERCIAL_ACTION_TYPE_LABELS;
  readonly ACTION_PRIORITY_LABELS = COMMERCIAL_ACTION_PRIORITY_LABELS;
  readonly TICKET_STATUS_LABELS   = SUPPORT_TICKET_STATUS_LABELS;

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

  goAction(action: CommercialActionResponse): void {
    this.router.navigate(['/crm/commercial-actions', action.publicId]);
  }

  goDeal(deal: DealSummary): void {
    this.router.navigate(['/crm/deals', deal.publicId]);
  }

  goTicket(ticket: SupportTicketSummary): void {
    this.router.navigate(['/crm/support-tickets', ticket.publicId]);
  }
}
