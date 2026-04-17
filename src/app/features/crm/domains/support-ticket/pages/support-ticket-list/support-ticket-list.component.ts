/**
 * Paginated list page for CRM support tickets.
 *
 * Supports keyword search, status/source filters, advanced filters (contact, assignee,
 * organisation) via picker components, and pagination.
 * Navigates to {@link SupportTicketDetailComponent} on row click.
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CrmSupportTicketApiService } from '../../services/crm-support-ticket-api.service';
import {
  SupportTicketSummary,
  SupportTicketStatus,
  SupportTicketSource,
  SupportTicketFilter,
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_SOURCE_LABELS
} from '../../models/support-ticket.model';
import { SupportTicketStatusBadgeComponent } from '../../components/support-ticket-status-badge/support-ticket-status-badge.component';
import { Page } from '../../../../shared/models/page.model';
import { CrmEmptyStateComponent } from '../../../../shared/empty-state/crm-empty-state.component';
import { ContactPickerComponent, ContactPickerValue } from '../../../../shared/pickers/contact-picker/contact-picker.component';
import { CommercialPickerComponent } from '../../../../shared/pickers/commercial-picker/commercial-picker.component';
import { OrganisationPickerComponent, OrganisationPickerValue } from '../../../../shared/pickers/organisation-picker/organisation-picker.component';

@Component({
  selector: 'app-support-ticket-list',
  imports: [FormsModule, DatePipe, SupportTicketStatusBadgeComponent, CrmEmptyStateComponent,
            ContactPickerComponent, CommercialPickerComponent, OrganisationPickerComponent],
  templateUrl: './support-ticket-list.component.html',
  styleUrl: './support-ticket-list.component.scss'
})
export class SupportTicketListComponent implements OnInit {

  private readonly api    = inject(CrmSupportTicketApiService);
  private readonly router = inject(Router);

  readonly page    = signal<Page<SupportTicketSummary> | null>(null);
  readonly loading = signal(false);

  // Filters
  keyword                 = '';
  statusFilter: SupportTicketStatus | '' = '';
  sourceFilter: SupportTicketSource | '' = '';
  unassignedOnly          = false;
  contactPublicId         = '';
  assignedToPublicId      = '';
  organisationPublicId    = '';

  showAdvancedFilters = false;

  currentPage = 0;
  readonly pageSize = 15;

  readonly statuses      = Object.values(SupportTicketStatus);
  readonly statusLabels  = SUPPORT_TICKET_STATUS_LABELS;
  readonly sources       = Object.values(SupportTicketSource);
  readonly sourceLabels  = SUPPORT_TICKET_SOURCE_LABELS;
  readonly SupportTicketSource = SupportTicketSource;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const filter: SupportTicketFilter = {
      ...(this.keyword.trim()          && { keyword:               this.keyword.trim() }),
      ...(this.statusFilter            && { status:                this.statusFilter as SupportTicketStatus }),
      ...(this.sourceFilter            && { source:                this.sourceFilter as SupportTicketSource }),
      ...(this.unassignedOnly          && { unassignedOnly:        true }),
      ...(this.contactPublicId         && { contactPublicId:       this.contactPublicId }),
      ...(this.assignedToPublicId      && { assignedToPublicId:    this.assignedToPublicId }),
      ...(this.organisationPublicId    && { organisationPublicId:  this.organisationPublicId }),
    };
    this.api.findAll(filter, this.currentPage, this.pageSize).subscribe({
      next: p => { this.page.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  search(): void { this.currentPage = 0; this.load(); }

  onContactSelected(v: ContactPickerValue | null): void {
    this.contactPublicId = v?.publicId ?? '';
    this.search();
  }

  onAssigneeSelected(publicId: string | null): void {
    this.assignedToPublicId = publicId ?? '';
    this.search();
  }

  onOrganisationSelected(v: OrganisationPickerValue | null): void {
    this.organisationPublicId = v?.publicId ?? '';
    this.search();
  }

  onUnassignedOnlyChange(): void {
    if (this.unassignedOnly) {
      this.assignedToPublicId = '';
    }
    this.search();
  }

  goTo(p: number): void { this.currentPage = p; this.load(); }

  openDetail(publicId: string): void {
    this.router.navigate(['/crm/support-tickets', publicId]);
  }

  newTicket(): void { this.router.navigate(['/crm/support-tickets/new']); }

  initials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
}
