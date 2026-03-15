import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CrmSupportTicketApiService } from '../../services/crm-support-ticket-api.service';
import {
  SupportTicketSummary,
  SupportTicketStatus,
  SupportTicketFilter,
  SUPPORT_TICKET_STATUS_LABELS
} from '../../models/support-ticket.model';
import { SupportTicketStatusBadgeComponent } from '../../components/support-ticket-status-badge/support-ticket-status-badge.component';
import { Page } from '../../../../shared/models/page.model';
import { CrmEmptyStateComponent } from '../../../../shared/empty-state/crm-empty-state.component';

@Component({
  selector: 'app-support-ticket-list',
  imports: [FormsModule, DatePipe, SupportTicketStatusBadgeComponent, CrmEmptyStateComponent],
  templateUrl: './support-ticket-list.component.html',
  styleUrl: './support-ticket-list.component.scss'
})
export class SupportTicketListComponent implements OnInit {

  private readonly api    = inject(CrmSupportTicketApiService);
  private readonly router = inject(Router);

  readonly page    = signal<Page<SupportTicketSummary> | null>(null);
  readonly loading = signal(false);

  // Filters
  keyword       = '';
  statusFilter: SupportTicketStatus | '' = '';
  unassignedOnly = false;

  currentPage = 0;
  readonly pageSize = 15;

  readonly statuses     = Object.values(SupportTicketStatus);
  readonly statusLabels = SUPPORT_TICKET_STATUS_LABELS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const filter: SupportTicketFilter = {
      ...(this.keyword.trim()  && { keyword: this.keyword.trim() }),
      ...(this.statusFilter    && { status: this.statusFilter as SupportTicketStatus }),
      ...(this.unassignedOnly  && { unassignedOnly: true }),
    };
    this.api.findAll(filter, this.currentPage, this.pageSize).subscribe({
      next: p => { this.page.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  search(): void { this.currentPage = 0; this.load(); }

  goTo(p: number): void { this.currentPage = p; this.load(); }

  openDetail(publicId: string): void {
    this.router.navigate(['/crm/support-tickets', publicId]);
  }

  newTicket(): void { this.router.navigate(['/crm/support-tickets/new']); }
}
