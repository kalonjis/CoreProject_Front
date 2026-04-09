import { Component, DestroyRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { LeadFacade }   from '../../facades/lead.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { LeadDetail, LeadFilter, LeadSource, LeadStatus, LeadSummary, LeadType, LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, LEAD_TYPE_LABELS } from '../../models/lead.model';
import { LeadStatusBadgeComponent }   from '../../components/lead-status-badge/lead-status-badge.component';
import { CrmEmptyStateComponent }     from '../../../../shared/empty-state/crm-empty-state.component';
import { LeadActionCreateComponent }  from '../../components/lead-action-create/lead-action-create.component';
import { CrmUserApiService }          from '../../../../shared/services/crm-user-api.service';
import { CommercialSummary, commercialDisplayName } from '../../../../shared/models/commercial.model';

@Component({
  selector: 'app-lead-list',
  providers: [LeadFacade, InteractionFacade],
  imports: [FormsModule, DatePipe, LeadStatusBadgeComponent, CrmEmptyStateComponent, LeadActionCreateComponent],
  templateUrl: './lead-list.component.html',
  styleUrl: './lead-list.component.scss'
})
export class LeadListComponent implements OnInit {

  readonly facade      = inject(LeadFacade);
  private readonly router      = inject(Router);
  private readonly destroyRef  = inject(DestroyRef);
  private readonly userApi     = inject(CrmUserApiService);
  private readonly keywordSubject = new Subject<void>();

  readonly loading= this.facade.listLoading;
  readonly error= signal<string | null>(null);
  readonly leads= this.facade.leads;
  readonly totalElements= this.facade.totalElements;
  readonly totalPages= this.facade.totalPages;

  readonly showCreate      = signal(false);
  readonly commercials     = signal<CommercialSummary[]>([]);
  readonly popoverLeadId   = signal<string | null>(null);
  readonly commercialDisplayName = commercialDisplayName;

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

  readonly sortField = signal<string>('submittedAt');
  readonly sortDir   = signal<'asc' | 'desc'>('desc');

  @HostListener('document:click')
  onDocClick(): void { this.popoverLeadId.set(null); }

  ngOnInit(): void {
    this.keywordSubject.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => { this.currentPage = 0; this.loadLeads(); });

    this.loadLeads();
    this.userApi.getCommercials().subscribe({ next: list => this.commercials.set(list), error: () => {} });
  }

  loadLeads(): void {
    const f: LeadFilter = {};
    if (this.selectedStatus)  f.status        = this.selectedStatus;
    if (this.selectedType)    f.leadType       = this.selectedType;
    if (this.selectedSource)  f.leadSource     = this.selectedSource;
    if (this.keyword.trim())  f.keyword        = this.keyword;
    if (this.unassignedOnly)  f.unassignedOnly = true;
    if (this.activeOnly && !this.selectedStatus) f.activeOnly = true;
    this.facade.loadList(f, this.currentPage, this.pageSize, this.sortField(), this.sortDir());
  }

  onFilterChange(): void { this.currentPage = 0; this.loadLeads(); }
  onKeywordChange(): void { this.keywordSubject.next(); }
  goToPage(page: number): void { this.currentPage = page; this.loadLeads(); }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.currentPage = 0;
    this.loadLeads();
  }

  isSorted(field: string): boolean {
    return this.sortField() === field;
  }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/leads', publicId]); }
  goPipeline(): void { this.router.navigate(['/crm/pipeline']); }

  onLeadCreated(lead: LeadDetail): void {
    this.showCreate.set(false);
    this.router.navigate(['/crm/leads', lead.publicId]);
  }

  initials(name: string): string {
    const parts = name.split('.');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  commercialInitials(c: CommercialSummary): string {
    if (c.firstName && c.lastName) return (c.firstName[0] + c.lastName[0]).toUpperCase();
    return c.username.substring(0, 2).toUpperCase();
  }

  isOverdue(submittedAt: string): boolean {
    return Date.now() - new Date(submittedAt).getTime() > 24 * 60 * 60 * 1000;
  }

  openAssignPopover(event: MouseEvent, leadPublicId: string): void {
    event.stopPropagation();
    this.popoverLeadId.set(this.popoverLeadId() === leadPublicId ? null : leadPublicId);
  }

  selectCommercial(event: MouseEvent, lead: LeadSummary, commercial: CommercialSummary): void {
    event.stopPropagation();
    this.popoverLeadId.set(null);
    this.facade.assignInList(lead.publicId, { commercialPublicId: commercial.publicId }, commercial.username);
  }
}
