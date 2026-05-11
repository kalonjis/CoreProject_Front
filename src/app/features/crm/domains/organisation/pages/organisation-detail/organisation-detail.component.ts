import { Component, OnInit, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import { OrganisationDetail } from '../../models/organisation.model';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { OrganisationInfoCardComponent } from '../../components/organisation-info-card/organisation-info-card.component';
import { OrganisationActionMergeComponent } from '../../components/organisation-action-merge/organisation-action-merge.component';
import { OrganisationActionStatusComponent } from '../../components/organisation-action-status/organisation-action-status.component';
import { ContactActionCreateComponent } from '../../../contact/components/contact-action-create/contact-action-create.component';
import { ContactStatusBadgeComponent } from '../../../contact/components/contact-status-badge/contact-status-badge.component';
import { DealActionCreateComponent } from '../../../deal/components/deal-action-create/deal-action-create.component';
import { DealMiniCardComponent } from '../../../deal/components/deal-mini-card/deal-mini-card.component';
import { CrmEmptyStateComponent } from '../../../../shared/empty-state/crm-empty-state.component';
import { InteractionTimelineComponent } from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { SupportTicketStatusBadgeComponent } from '../../../support-ticket/components/support-ticket-status-badge/support-ticket-status-badge.component';
import { ChangeLogListComponent } from '../../../crm-change-log/components/change-log-list/change-log-list.component';
import { LogCallModalComponent }    from '../../../interaction/components/modals/log-call-modal/log-call-modal.component';
import { LogEmailModalComponent }   from '../../../interaction/components/modals/log-email-modal/log-email-modal.component';
import { LogNoteModalComponent }    from '../../../interaction/components/modals/log-note-modal/log-note-modal.component';
import { LogMeetingModalComponent } from '../../../interaction/components/modals/log-meeting-modal/log-meeting-modal.component';
import { CrmTagApiService } from '../../../tag/services/crm-tag-api.service';
import { CrmSupportTicketApiService } from '../../../support-ticket/services/crm-support-ticket-api.service';
import { Tag } from '../../../tag/models/tag.model';
import { ContactDetail, ContactSummary } from '../../../contact/models/contact.model';
import { DealSummary } from '../../../deal/models/deal.model';
import { SupportTicketSummary } from '../../../support-ticket/models/support-ticket.model';

type ActionPanel  = 'merge' | 'status' | null;
type OrgTab       = 'interactions' | 'contacts' | 'deals' | 'tickets' | 'modifications';
type QuickIntent  = 'note' | 'call' | 'email' | 'meeting';

@Component({
  selector: 'app-organisation-detail',
  providers: [InteractionFacade],
  imports: [
    DatePipe,
    RouterLink,
    OrganisationInfoCardComponent,
    OrganisationActionMergeComponent,
    OrganisationActionStatusComponent,
    ContactActionCreateComponent,
    ContactStatusBadgeComponent,
    SupportTicketStatusBadgeComponent,
    DealActionCreateComponent,
    DealMiniCardComponent,
    CrmEmptyStateComponent,
    InteractionTimelineComponent,
    ChangeLogListComponent,
    LogCallModalComponent,
    LogEmailModalComponent,
    LogNoteModalComponent,
    LogMeetingModalComponent,
  ],
  templateUrl: './organisation-detail.component.html',
  styleUrl: './organisation-detail.component.scss'
})
export class OrganisationDetailComponent implements OnInit {

  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly api       = inject(CrmOrganisationApiService);
  private readonly ticketApi = inject(CrmSupportTicketApiService);
  private readonly tagApi    = inject(CrmTagApiService);
  readonly interactionFacade = inject(InteractionFacade);

  readonly organisation      = signal<OrganisationDetail | null>(null);
  readonly loading           = signal(false);
  readonly error             = signal<string | null>(null);
  readonly activeAction      = signal<ActionPanel>(null);
  readonly showCreateContact = signal(false);
  readonly showCreateDeal    = signal(false);
  readonly tags              = signal<Tag[]>([]);
  readonly allTags           = signal<Tag[]>([]);
  readonly tagQuery          = signal('');
  readonly showTagPopover    = signal(false);
  readonly activeTab         = signal<OrgTab>('interactions');

  readonly filteredTags = computed(() => {
    const q       = this.tagQuery().toLowerCase().trim();
    const applied = this.tags();
    const pool    = this.allTags().filter(t => !applied.some(a => a.publicId === t.publicId));
    return q ? pool.filter(t => t.name.toLowerCase().includes(q)) : pool;
  });

  readonly canCreateTag = computed(() => {
    const q = this.tagQuery().trim().toLowerCase();
    return q.length > 0 && !this.allTags().some(t => t.name.toLowerCase() === q);
  });

  readonly displayedTags = computed(() => {
    const tags = this.filteredTags();
    return this.tagQuery() ? tags : tags.slice(0, 8);
  });

  readonly contacts        = signal<ContactSummary[]>([]);
  readonly contactsLoading = signal(false);
  readonly tickets         = signal<SupportTicketSummary[]>([]);
  readonly ticketsLoading  = signal(false);
  readonly deals           = signal<DealSummary[]>([]);
  readonly dealsLoading    = signal(false);

  readonly pendingIntent       = signal<QuickIntent | null>(null);
  readonly showContactPicker   = signal(false);
  readonly selectedContact     = signal<ContactSummary | null>(null);
  readonly showLogNoteModal    = signal(false);
  readonly showLogCallModal    = signal(false);
  readonly showLogEmailModal   = signal(false);
  readonly showLogMeetingModal = signal(false);

  private publicId = '';

  private readonly elRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) this.showTagPopover.set(false);
  }

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.load();
    this.loadContacts();
    this.loadTickets();
    this.loadDeals();
    this.interactionFacade.loadFor('organisation', this.publicId);
    this.tagApi.findAll().subscribe(tags => this.allTags.set(tags));
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getByPublicId(this.publicId).subscribe({
      next: org => { this.organisation.set(org); this.tags.set(org.tags ?? []); this.loading.set(false); },
      error: () => { this.error.set('Organisation introuvable.'); this.loading.set(false); }
    });
  }

  private loadContacts(): void {
    this.contactsLoading.set(true);
    this.api.getContacts(this.publicId).subscribe({
      next: c  => { this.contacts.set(c); this.contactsLoading.set(false); },
      error: () => this.contactsLoading.set(false)
    });
  }

  private loadTickets(): void {
    this.ticketsLoading.set(true);
    this.ticketApi.findAll({ organisationPublicId: this.publicId }, 0, 50).subscribe({
      next: page => { this.tickets.set(page.content); this.ticketsLoading.set(false); },
      error: ()  => this.ticketsLoading.set(false)
    });
  }

  private loadDeals(): void {
    this.dealsLoading.set(true);
    this.api.getDeals(this.publicId).subscribe({
      next: d  => { this.deals.set(d); this.dealsLoading.set(false); },
      error: () => this.dealsLoading.set(false)
    });
  }

  setAction(action: ActionPanel): void {
    this.activeAction.set(this.activeAction() === action ? null : action);
  }

  onStatusChanged(): void {
    this.activeAction.set(null);
    this.load();
  }

  onMerged(survivingId: string): void {
    this.activeAction.set(null);
    this.router.navigate(['/crm/organisations', survivingId]);
  }

  onContactCreated(contact: ContactDetail): void {
    this.showCreateContact.set(false);
    this.loadContacts();
    this.router.navigate(['/crm/contacts', contact.publicId]);
  }

  onDealCreated(): void {
    this.showCreateDeal.set(false);
    this.loadDeals();
  }

  selectTag(tag: Tag): void {
    this.tagApi.addToOrganisation(tag.publicId, this.publicId).subscribe(() => {
      this.tags.update(list => [...list, tag]);
      this.tagQuery.set('');
      this.showTagPopover.set(false);
    });
  }

  createAndAddTag(): void {
    const name = this.tagQuery().trim();
    if (!name) return;
    this.tagApi.create({ name }).subscribe(tag => {
      this.allTags.update(list => [...list, tag].sort((a, b) => a.name.localeCompare(b.name)));
      this.selectTag(tag);
    });
  }

  removeTag(tag: Tag): void {
    this.tagApi.removeFromOrganisation(tag.publicId, this.publicId).subscribe(() =>
      this.tags.update(list => list.filter(t => t.publicId !== tag.publicId))
    );
  }

  onInteractionDelete(interactionPublicId: string): void {
    this.interactionFacade.deleteInteraction(interactionPublicId);
  }

  /** Initials for the contact avatar (first + last name). */
  contactInitials(c: ContactSummary): string {
    return (c.firstName[0] ?? '') + (c.lastName[0] ?? '');
  }

  openQuickAction(intent: QuickIntent): void {
    if (this.contacts().length === 0) return;
    this.pendingIntent.set(intent);
    if (this.contacts().length === 1) {
      this.selectedContact.set(this.contacts()[0]);
      this._openModal(intent);
    } else {
      this.showContactPicker.set(true);
    }
  }

  selectContactForAction(contact: ContactSummary): void {
    this.selectedContact.set(contact);
    this.showContactPicker.set(false);
    const intent = this.pendingIntent();
    if (intent) this._openModal(intent);
  }

  onLogged(): void {
    this.showLogNoteModal.set(false);
    this.showLogCallModal.set(false);
    this.showLogEmailModal.set(false);
    this.showLogMeetingModal.set(false);
    this.pendingIntent.set(null);
    this.selectedContact.set(null);
    this.interactionFacade.refresh();
  }

  private _openModal(intent: QuickIntent): void {
    this.showLogNoteModal.set(intent === 'note');
    this.showLogCallModal.set(intent === 'call');
    this.showLogEmailModal.set(intent === 'email');
    this.showLogMeetingModal.set(intent === 'meeting');
  }

  goEdit(): void { this.router.navigate(['/crm/organisations', this.publicId, 'edit']); }
}
