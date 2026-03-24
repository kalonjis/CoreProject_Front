import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContactFacade }  from '../../facades/contact.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { ContactFilter, ContactStatus, CONTACT_STATUS_LABELS } from '../../models/contact.model';
import { ContactStatusBadgeComponent } from '../../components/contact-status-badge/contact-status-badge.component';
import { CrmEmptyStateComponent }      from '../../../../shared/empty-state/crm-empty-state.component';

@Component({
  selector: 'app-contact-list',
  providers: [ContactFacade, InteractionFacade],
  imports: [FormsModule, ContactStatusBadgeComponent, CrmEmptyStateComponent],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss'
})
export class ContactListComponent implements OnInit {

  readonly facade = inject(ContactFacade);
  private readonly router = inject(Router);

  readonly loading       = this.facade.listLoading;
  readonly error         = signal<string | null>(null);
  readonly contacts      = this.facade.contacts;
  readonly totalElements = this.facade.totalElements;
  readonly totalPages    = this.facade.totalPages;

  readonly statuses     = Object.values(ContactStatus);
  readonly statusLabels = CONTACT_STATUS_LABELS;

  currentPage    = 0;
  readonly pageSize = 20;
  keyword        = '';
  selectedStatus: ContactStatus | '' = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    const f: ContactFilter = {};
    if (this.keyword.trim()) f.keyword = this.keyword;
    if (this.selectedStatus) f.status  = this.selectedStatus;
    this.facade.loadList(f, this.currentPage, this.pageSize);
  }

  onFilterChange(): void { this.currentPage = 0; this.load(); }
  onKeywordChange(): void { this.currentPage = 0; this.load(); }
  goToPage(page: number): void { this.currentPage = page; this.load(); }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/contacts', publicId]); }
  goCreate(): void { this.router.navigate(['/crm/contacts/new']); }
}
