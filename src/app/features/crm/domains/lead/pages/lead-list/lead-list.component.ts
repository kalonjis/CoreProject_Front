import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { LeadFacade }   from '../../facades/lead.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { LeadDetail, LeadFilter, LeadSource, LeadStatus, LeadType, LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, LEAD_TYPE_LABELS } from '../../models/lead.model';
import { LeadStatusBadgeComponent }   from '../../components/lead-status-badge/lead-status-badge.component';
import { LeadTypeBadgeComponent }     from '../../components/lead-type-badge/lead-type-badge.component';
import { CrmEmptyStateComponent }     from '../../../../shared/empty-state/crm-empty-state.component';
import { LeadActionCreateComponent }  from '../../components/lead-action-create/lead-action-create.component';

@Component({
  selector: 'app-lead-list',
  providers: [LeadFacade, InteractionFacade],
  imports: [FormsModule, DatePipe, LeadStatusBadgeComponent, LeadTypeBadgeComponent, CrmEmptyStateComponent, LeadActionCreateComponent],
  templateUrl: './lead-list.component.html',
  styleUrl: './lead-list.component.scss'
})
export class LeadListComponent implements OnInit {

  readonly facade = inject(LeadFacade);
  private readonly router = inject(Router);

  readonly loading= this.facade.listLoading;
  readonly error= signal<string | null>(null);
  readonly leads= this.facade.leads;
  readonly totalElements= this.facade.totalElements;
  readonly totalPages= this.facade.totalPages;

  readonly showCreate = signal(false);

  readonly statuses     = Object.values(LeadStatus);
  readonly types        = Object.values(LeadType);
  readonly sources      = Object.values(LeadSource);
  readonly statusLabels = LEAD_STATUS_LABELS;
  readonly typeLabels   = LEAD_TYPE_LABELS;
  readonly sourceLabels = LEAD_SOURCE_LABELS;

  currentPage    = 0;
  readonly pageSize = 20;
  keyword        = '';
  selectedStatus: LeadStatus | '' = '';
  selectedType:   LeadType   | '' = '';
  selectedSource: LeadSource | '' = '';
  unassignedOnly = false;
  activeOnly     = true;

  ngOnInit(): void { this.loadLeads(); }

  loadLeads(): void {
    const f: LeadFilter = {};
    if (this.selectedStatus)  f.status        = this.selectedStatus;
    if (this.selectedType)    f.leadType       = this.selectedType;
    if (this.selectedSource)  f.leadSource     = this.selectedSource;
    if (this.keyword.trim())  f.keyword        = this.keyword;
    if (this.unassignedOnly)  f.unassignedOnly = true;
    if (this.activeOnly && !this.selectedStatus) f.activeOnly = true;
    this.facade.loadList(f, this.currentPage, this.pageSize);
  }

  onFilterChange(): void { this.currentPage = 0; this.loadLeads(); }
  onKeywordChange(): void { this.currentPage = 0; this.loadLeads(); }
  goToPage(page: number): void { this.currentPage = page; this.loadLeads(); }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/leads', publicId]); }
  goPipeline(): void { this.router.navigate(['/crm/pipeline']); }

  onLeadCreated(lead: LeadDetail): void {
    this.showCreate.set(false);
    this.router.navigate(['/crm/leads', lead.publicId]);
  }
}
