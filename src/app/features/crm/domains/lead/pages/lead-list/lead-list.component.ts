import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { LeadSummary, LeadFilter, LeadStatus, LeadType, LEAD_STATUS_LABELS, LEAD_TYPE_LABELS } from '../../models/lead.model';
import { LeadStatusBadgeComponent } from '../../components/lead-status-badge/lead-status-badge.component';
import { LeadTypeBadgeComponent } from '../../components/lead-type-badge/lead-type-badge.component';
import { CrmEmptyStateComponent } from '../../../../shared/empty-state/crm-empty-state.component';

@Component({
  selector: 'app-lead-list',
  imports: [FormsModule, DatePipe, LeadStatusBadgeComponent, LeadTypeBadgeComponent, CrmEmptyStateComponent],
  templateUrl: './lead-list.component.html',
  styleUrl: './lead-list.component.scss'
})
export class LeadListComponent implements OnInit {

  private readonly api    = inject(CrmLeadApiService);
  private readonly router = inject(Router);

  // ─── State ─────────────────────────────────────────────────────────────────

  readonly leads         = signal<LeadSummary[]>([]);
  readonly totalPages    = signal(0);
  readonly totalElements = signal(0);
  readonly loading       = signal(false);
  readonly error         = signal<string | null>(null);

  currentPage = 0;
  readonly pageSize = 20;

  // ─── Filter ────────────────────────────────────────────────────────────────

  keyword        = '';
  selectedStatus : LeadStatus | '' = '';
  selectedType   : LeadType | ''   = '';
  unassignedOnly = false;

  // ─── Lookup tables ─────────────────────────────────────────────────────────

  readonly statuses     = Object.values(LeadStatus);
  readonly types        = Object.values(LeadType);
  readonly statusLabels = LEAD_STATUS_LABELS;
  readonly typeLabels   = LEAD_TYPE_LABELS;

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadLeads();
  }

  // ─── Data loading ──────────────────────────────────────────────────────────

  loadLeads(): void {
    this.loading.set(true);
    this.error.set(null);

    const f: LeadFilter = {};
    if (this.selectedStatus)  f.status        = this.selectedStatus;
    if (this.selectedType)    f.leadType       = this.selectedType;
    if (this.keyword.trim())  f.keyword        = this.keyword;
    if (this.unassignedOnly)  f.unassignedOnly = true;

    this.api.findAll(f, this.currentPage, this.pageSize).subscribe({
      next: page => {
        this.leads.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les leads.');
        this.loading.set(false);
      }
    });
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadLeads();
  }

  onKeywordChange(): void {
    this.currentPage = 0;
    this.loadLeads();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadLeads();
  }

  viewDetail(publicId: string): void {
    this.router.navigate(['/crm/leads', publicId]);
  }

  goPipeline(): void {
    this.router.navigate(['/crm/pipeline']);
  }
}
