import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { ContactFacade }  from '../../facades/contact.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { ContactFilter, ContactStatus, ContactSummary, CONTACT_STATUS_LABELS } from '../../models/contact.model';
import { ContactStatusBadgeComponent } from '../../components/contact-status-badge/contact-status-badge.component';
import { CrmEmptyStateComponent }      from '../../../../shared/empty-state/crm-empty-state.component';
import { CrmTagApiService } from '../../../tag/services/crm-tag-api.service';
import { Tag } from '../../../tag/models/tag.model';
import { CrmUserApiService }          from '../../../../shared/services/crm-user-api.service';
import { CrmAssignPopoverComponent }  from '../../../../shared/components/assign-popover/crm-assign-popover.component';
import { CommercialSummary } from '../../../../shared/models/commercial.model';
import { ContactActionCreateComponent } from '../../components/contact-action-create/contact-action-create.component';
import { OrganisationActionCreateComponent } from '../../../organisation/components/organisation-action-create/organisation-action-create.component';
import { ContactDetail } from '../../models/contact.model';
import { OrganisationDetail } from '../../../organisation/models/organisation.model';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-contact-list',
  providers: [ContactFacade, InteractionFacade],
  imports: [FormsModule, ContactStatusBadgeComponent, CrmEmptyStateComponent, ContactActionCreateComponent, OrganisationActionCreateComponent, CrmAssignPopoverComponent],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss'
})
/**
 * Paginated contact list page with keyword search, status/tag filters, sortable columns,
 * quick-assign popover, and inline contact/organisation creation.
 */
export class ContactListComponent implements OnInit {

  readonly facade  = inject(ContactFacade);
  private readonly router      = inject(Router);
  private readonly tagApi      = inject(CrmTagApiService);
  private readonly userApi     = inject(CrmUserApiService);
  private readonly contactApi  = inject(CrmContactApiService);
  private readonly feedback    = inject(FeedbackService);
  private readonly destroyRef  = inject(DestroyRef);
  private readonly keywordSubject = new Subject<void>();

  /** True while the paginated list is loading. */
  readonly loading       = this.facade.listLoading;
  /** Last load error message, or null. */
  readonly error         = signal<string | null>(null);
  /** Current page of contact summaries. */
  readonly contacts      = this.facade.contacts;
  /** Total number of contacts matching the current filter. */
  readonly totalElements = this.facade.totalElements;
  /** Total number of pages for the current filter. */
  readonly totalPages    = this.facade.totalPages;
  /** All available tags for the tag filter dropdown. */
  readonly allTags              = signal<Tag[]>([]);
  /** Available commercials for the quick-assign popover. */
  readonly commercials          = signal<CommercialSummary[]>([]);
  /** Controls visibility of the inline contact creation form. */
  readonly showCreate           = signal(false);
  /** Public ID of the contact awaiting an organisation link, or null. */
  readonly pendingLinkContactId = signal<string | null>(null);

  readonly statuses     = Object.values(ContactStatus);
  readonly statusLabels = CONTACT_STATUS_LABELS;

  currentPage         = 0;
  readonly pageSize   = 20;
  keyword             = '';
  selectedStatus: ContactStatus | '' = '';
  selectedTagPublicId = '';

  readonly sortField = signal<string>('lastName');
  readonly sortDir   = signal<'asc' | 'desc'>('asc');

  ngOnInit(): void {
    this.keywordSubject.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => { this.currentPage = 0; this.load(); });

    this.tagApi.findAll().subscribe(tags => this.allTags.set(tags));
    this.userApi.getCommercials().subscribe({ next: list => this.commercials.set(list), error: () => {} });
    this.load();
  }

  /** Loads the current page of contacts with the active filters applied. */
  load(): void {
    const f: ContactFilter = {};
    if (this.keyword.trim())       f.keyword    = this.keyword;
    if (this.selectedStatus)       f.status     = this.selectedStatus;
    if (this.selectedTagPublicId)  f.tagPublicId = this.selectedTagPublicId;
    this.facade.loadList(f, this.currentPage, this.pageSize, this.sortField(), this.sortDir());
  }

  /** Resets to page 0 and reloads when a filter changes. */
  onFilterChange(): void { this.currentPage = 0; this.load(); }
  /** Pushes a keyword change through the debounced subject. */
  onKeywordChange(): void { this.keywordSubject.next(); }
  /** Navigates to the given page number. */
  goToPage(page: number): void { this.currentPage = page; this.load(); }

  /** Toggles sort direction if the same field is clicked, or switches to a new sort field. */
  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.currentPage = 0;
    this.load();
  }

  /** True when the given field is the active sort column. */
  isSorted(field: string): boolean { return this.sortField() === field; }

  onContactAssigned(contact: ContactSummary, commercial: CommercialSummary): void {
    this.facade.assignInList(contact.publicId, { commercialPublicId: commercial.publicId }, commercial.username);
  }

  goToOrg(event: MouseEvent, orgPublicId: string): void {
    event.stopPropagation();
    this.router.navigate(['/crm/organisations', orgPublicId]);
  }

  onContactCreated(contact: ContactDetail): void {
    this.showCreate.set(false);
    this.router.navigate(['/crm/contacts', contact.publicId]);
  }

  openLinkOrgModal(event: MouseEvent, contactPublicId: string): void {
    event.stopPropagation();
    this.pendingLinkContactId.set(contactPublicId);
  }

  onOrgCreatedForLink(org: OrganisationDetail): void {
    const contactId = this.pendingLinkContactId();
    if (!contactId) return;
    this.contactApi.linkOrganisation(contactId, { organisationPublicId: org.publicId }).subscribe({
      next: () => {
        this.facade.updateOrgInList(contactId, org.publicId, org.name);
        this.feedback.showSuccess('Organisation liée au contact.');
        this.pendingLinkContactId.set(null);
      },
      error: () => {
        this.feedback.showError('Impossible de lier l\'organisation.');
        this.pendingLinkContactId.set(null);
      }
    });
  }

  viewDetail(publicId: string): void { this.router.navigate(['/crm/contacts', publicId]); }
  goCreate(): void { this.showCreate.set(true); }
}
