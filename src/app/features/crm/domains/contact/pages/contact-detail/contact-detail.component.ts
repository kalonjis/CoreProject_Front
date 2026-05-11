import { Component, OnInit, inject, signal, effect, computed, HostListener, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ContactFacade }    from '../../facades/contact.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { CrmContactApiService }            from '../../services/crm-contact-api.service';
import { CrmTagApiService }                from '../../../tag/services/crm-tag-api.service';
import { CrmSupportTicketApiService }      from '../../../support-ticket/services/crm-support-ticket-api.service';
import { ContactInfoCardComponent }        from '../../components/contact-info-card/contact-info-card.component';
import { ContactActionMergeComponent }     from '../../components/contact-action-merge/contact-action-merge.component';
import { InteractionTimelineComponent }    from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { InteractionLogFormComponent }     from '../../../interaction/components/interaction-log-form/interaction-log-form.component';
import { CommercialActionTodoListComponent } from '../../../commercial-action/components/commercial-action-todo-list/commercial-action-todo-list.component';
import { CompleteEvent } from '../../../commercial-action/components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent }   from '../../../commercial-action/components/commercial-action-form/commercial-action-form.component';
import { DealActionCreateComponent }       from '../../../deal/components/deal-action-create/deal-action-create.component';
import { DealMiniCardComponent }           from '../../../deal/components/deal-mini-card/deal-mini-card.component';
import { CrmEmptyStateComponent }          from '../../../../shared/empty-state/crm-empty-state.component';
import { EmailComposeComponent, EmailComposeSubmit } from '../../../../shared/email-compose/email-compose.component';
import { SupportTicketStatusBadgeComponent } from '../../../support-ticket/components/support-ticket-status-badge/support-ticket-status-badge.component';
import { DealSummary }                     from '../../../deal/models/deal.model';
import { Tag }                             from '../../../tag/models/tag.model';
import { SupportTicketSummary }            from '../../../support-ticket/models/support-ticket.model';
import { CommercialActionStatus, CommercialActionType, CommercialActionResponse, requiresCalendarSlot } from '../../../commercial-action/models/commercial-action.model';
import { LogCallModalComponent }         from '../../../interaction/components/modals/log-call-modal/log-call-modal.component';
import { LogEmailModalComponent }        from '../../../interaction/components/modals/log-email-modal/log-email-modal.component';
import { LogNoteModalComponent }         from '../../../interaction/components/modals/log-note-modal/log-note-modal.component';
import { LogMeetingModalComponent }      from '../../../interaction/components/modals/log-meeting-modal/log-meeting-modal.component';
import { ScheduleCallModalComponent }    from '../../../commercial-action/components/modals/schedule-call-modal/schedule-call-modal.component';
import { ScheduleMeetingModalComponent } from '../../../commercial-action/components/modals/schedule-meeting-modal/schedule-meeting-modal.component';
import { CreateTaskModalComponent }      from '../../../commercial-action/components/modals/create-task-modal/create-task-modal.component';

/** Union of inline action panels that can be shown on the contact detail page. */
type ActiveAction = 'merge' | null;
/** Tab identifiers for the contact detail tabbed view. */
type ContactTab   = 'interactions' | 'afaire' | 'calendrier' | 'deals' | 'tickets';

@Component({
  selector: 'app-contact-detail',
  providers: [ContactFacade, InteractionFacade],
  imports: [
    ContactInfoCardComponent,
    ContactActionMergeComponent,
    InteractionTimelineComponent,
    InteractionLogFormComponent,
    CommercialActionTodoListComponent,
    CommercialActionFormComponent,
    DealActionCreateComponent,
    DealMiniCardComponent,
    CrmEmptyStateComponent,
    EmailComposeComponent,
    SupportTicketStatusBadgeComponent,
    LogCallModalComponent,
    LogEmailModalComponent,
    LogNoteModalComponent,
    LogMeetingModalComponent,
    ScheduleCallModalComponent,
    ScheduleMeetingModalComponent,
    CreateTaskModalComponent,
    DatePipe
  ],
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.scss'
})
/**
 * Contact detail page showing the info card, tabbed sections (activity, commercial actions,
 * deals, support tickets, change log), and inline action panels for assign/status/org/merge.
 */
export class ContactDetailComponent implements OnInit {

  readonly facade            = inject(ContactFacade);
  readonly interactionFacade = inject(InteractionFacade);

  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly contactApi  = inject(CrmContactApiService);
  private readonly tagApi      = inject(CrmTagApiService);
  private readonly ticketApi   = inject(CrmSupportTicketApiService);

  readonly activeTab        = signal<ContactTab>('interactions');
  readonly activeAction     = signal<ActiveAction>(null);
  readonly showLogForm      = signal(false);
  readonly showActionForm   = signal(false);
  readonly showDealCreate   = signal(false);
  readonly showEmailCompose = signal(false);
  readonly showTagPopover   = signal(false);

  /** Controls visibility of each specialized log modal (Interactions — the past). */
  readonly showLogCallModal    = signal(false);
  readonly showLogEmailModal   = signal(false);
  readonly showLogNoteModal    = signal(false);
  readonly showLogMeetingModal = signal(false);

  /** Controls visibility of each specialized schedule modal (À faire — the future). */
  readonly showScheduleCallModal    = signal(false);
  readonly showScheduleMeetingModal = signal(false);
  readonly showCreateTaskModal      = signal(false);

  readonly deals          = signal<DealSummary[]>([]);
  readonly dealsLoading   = signal(false);
  readonly tickets        = signal<SupportTicketSummary[]>([]);
  readonly ticketsLoading = signal(false);
  readonly tags           = signal<Tag[]>([]);
  readonly allTags        = signal<Tag[]>([]);
  readonly tagQuery       = signal('');

  readonly quickActionType       = signal<CommercialActionType | null>(null);

  readonly pendingActions        = computed(() => this.facade.actions().filter(a => a.status === CommercialActionStatus.PENDING));
  readonly calendarActions       = computed(() =>
    this.facade.actions()
      .filter(a => a.status === CommercialActionStatus.PENDING && requiresCalendarSlot(a.type) && !!a.dueDate)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  );
  readonly CommercialActionType  = CommercialActionType;
  readonly selectedCalendarEvent = signal<CommercialActionResponse | null>(null);

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

  private publicId = '';

  private readonly elRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) this.showTagPopover.set(false);
  }

  constructor() {
    effect(() => {
      const contact = this.facade.contact();
      if (contact) this.tags.set(contact.tags ?? []);
    });
  }

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId')!;
    this.facade.loadDetail(this.publicId);
    this.loadDeals();
    this.loadTickets();
    this.tagApi.findAll().subscribe(tags => this.allTags.set(tags));
  }

  private loadDeals(): void {
    this.dealsLoading.set(true);
    this.contactApi.getDeals(this.publicId).subscribe({
      next: d  => { this.deals.set(d); this.dealsLoading.set(false); },
      error: () => this.dealsLoading.set(false)
    });
  }

  private loadTickets(): void {
    this.ticketsLoading.set(true);
    this.ticketApi.findAll({ contactPublicId: this.publicId }, 0, 50).subscribe({
      next: p  => { this.tickets.set(p.content); this.ticketsLoading.set(false); },
      error: () => this.ticketsLoading.set(false)
    });
  }

  toggleAction(action: ActiveAction): void {
    this.activeAction.set(this.activeAction() === action ? null : action);
  }

  onActionDone(): void {
    this.activeAction.set(null);
    this.facade.loadDetail(this.publicId);
  }

  onInteractionLogged(): void {
    this.showLogForm.set(false);
    this.interactionFacade.refresh();
  }

  onInteractionDelete(interactionPublicId: string): void {
    this.interactionFacade.deleteInteraction(interactionPublicId);
  }

  onActionComplete(event: CompleteEvent): void {
    this.facade.completeAction(event.publicId, event.details);
  }

  onActionCancel(publicId: string): void {
    this.facade.cancelAction(publicId);
  }

  /**
   * Routes a quick-bar click to the correct modal based on intent and active tab.
   * On the Interactions tab: opens the matching Log modal (archiving the past).
   * On any other tab: opens the matching Schedule modal (planning the future).
   */
  openQuickAction(intent: 'note' | 'call' | 'email' | 'meeting' | 'task'): void {
    if (this.activeTab() === 'interactions' && intent !== 'task') {
      const logMap: Record<string, () => void> = {
        note:    () => this.showLogNoteModal.set(true),
        call:    () => this.showLogCallModal.set(true),
        email:   () => this.showLogEmailModal.set(true),
        meeting: () => this.showLogMeetingModal.set(true),
      };
      logMap[intent]?.();
    } else {
      const scheduleMap: Record<string, () => void> = {
        note:    () => { this.showCreateTaskModal.set(true); this.activeTab.set('afaire'); },
        call:    () => { this.showScheduleCallModal.set(true); this.activeTab.set('afaire'); },
        email:   () => { this.showCreateTaskModal.set(true); this.activeTab.set('afaire'); },
        meeting: () => { this.showScheduleMeetingModal.set(true); this.activeTab.set('calendrier'); },
        task:    () => { this.showCreateTaskModal.set(true); this.activeTab.set('afaire'); },
      };
      scheduleMap[intent]?.();
    }
  }

  /** Called after any log modal saves — refreshes the interaction timeline. */
  onLogged(): void {
    this.showLogCallModal.set(false);
    this.showLogEmailModal.set(false);
    this.showLogNoteModal.set(false);
    this.showLogMeetingModal.set(false);
    this.interactionFacade.refresh();
  }

  /** Called after any schedule modal saves — refreshes pending actions. */
  onScheduled(): void {
    this.showScheduleCallModal.set(false);
    this.showScheduleMeetingModal.set(false);
    this.showCreateTaskModal.set(false);
    this.facade.actionCreated(this.publicId);
  }

  onActionCreated(): void {
    this.showActionForm.set(false);
    this.quickActionType.set(null);
    this.facade.actionCreated(this.publicId);
  }

  onDealCreated(): void {
    this.showDealCreate.set(false);
    this.loadDeals();
  }

  selectTag(tag: Tag): void {
    this.tagApi.addToContact(tag.publicId, this.publicId).subscribe(() => {
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
    this.tagApi.removeFromContact(tag.publicId, this.publicId).subscribe(() =>
      this.tags.update(list => list.filter(t => t.publicId !== tag.publicId))
    );
  }

  onEmailSend(payload: EmailComposeSubmit): void {
    this.contactApi.sendEmail(this.publicId, payload).subscribe({
      next: () => {
        this.showEmailCompose.set(false);
        this.interactionFacade.refresh();
      },
      error: () => this.showEmailCompose.set(false)
    });
  }

  goEdit(): void        { this.router.navigate(['/crm/contacts', this.publicId, 'edit']); }
  back(): void          { this.router.navigate(['/crm/contacts']); }
  newTicket(): void     { this.router.navigate(['/crm/support-tickets/new'], { queryParams: { contactPublicId: this.publicId } }); }
  goToTicket(id: string): void { this.router.navigate(['/crm/support-tickets', id]); }
}
