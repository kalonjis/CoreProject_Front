import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { ContactSummary, ContactFilter, ContactStatus, CONTACT_STATUS_LABELS } from '../../models/contact.model';
import { ContactStatusBadgeComponent } from '../../components/contact-status-badge/contact-status-badge.component';
import { CrmEmptyStateComponent } from '../../../../shared/empty-state/crm-empty-state.component';

@Component({
  selector: 'app-contact-list',
  imports: [FormsModule, ContactStatusBadgeComponent, CrmEmptyStateComponent],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss'
})
export class ContactListComponent implements OnInit {

  private readonly api    = inject(CrmContactApiService);
  private readonly router = inject(Router);

  readonly contacts      = signal<ContactSummary[]>([]);
  readonly totalPages    = signal(0);
  readonly totalElements = signal(0);
  readonly loading       = signal(false);
  readonly error         = signal<string | null>(null);

  currentPage = 0;
  readonly pageSize = 20;

  keyword        = '';
  selectedStatus : ContactStatus | '' = '';

  readonly statuses     = Object.values(ContactStatus);
  readonly statusLabels = CONTACT_STATUS_LABELS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const f: ContactFilter = {};
    if (this.keyword.trim())  f.keyword = this.keyword;
    if (this.selectedStatus)  f.status  = this.selectedStatus;

    this.api.findAll(f, this.currentPage, this.pageSize).subscribe({
      next: page => {
        this.contacts.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => { this.error.set('Impossible de charger les contacts.'); this.loading.set(false); }
    });
  }

  onFilterChange(): void { this.currentPage = 0; this.load(); }
  onKeywordChange(): void { this.currentPage = 0; this.load(); }
  goToPage(page: number): void { this.currentPage = page; this.load(); }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/contacts', publicId]); }
  goCreate(): void { this.router.navigate(['/crm/contacts/new']); }
}
