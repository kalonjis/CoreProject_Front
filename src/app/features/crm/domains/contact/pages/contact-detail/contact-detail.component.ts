import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ContactFacade }    from '../../facades/contact.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { AuthStore }        from '../../../../../../core/auth/state/auth.store';
import { CrmContactApiService }            from '../../services/crm-contact-api.service';
import { CrmTagApiService }                from '../../../tag/services/crm-tag-api.service';
import { CrmSupportTicketApiService }      from '../../../support-ticket/services/crm-support-ticket-api.service';
import { ContactInfoCardComponent }        from '../../components/contact-info-card/contact-info-card.component';
import { ContactActionStatusComponent }    from '../../components/contact-action-status/contact-action-status.component';
import { ContactActionLinkOrgComponent }   from '../../components/contact-action-link-org/contact-action-link-org.component';
import { ContactActionMergeComponent }     from '../../components/contact-action-merge/contact-action-merge.component';
import { InteractionTimelineComponent }    from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { InteractionLogFormComponent }     from '../../../interaction/components/interaction-log-form/interaction-log-form.component';
import { CommercialActionCardComponent, CompleteEvent } from '../../../commercial-action/components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent }   from '../../../commercial-action/components/commercial-action-form/commercial-action-form.component';
import { DealActionCreateComponent }       from '../../../deal/components/deal-action-create/deal-action-create.component';
import { DealMiniCardComponent }           from '../../../deal/components/deal-mini-card/deal-mini-card.component';
import { CrmEmptyStateComponent }          from '../../../../shared/empty-state/crm-empty-state.component';
import { TagInputComponent }               from '../../../tag/components/tag-input/tag-input.component';
import { EmailComposeComponent, EmailComposeSubmit } from '../../../../shared/email-compose/email-compose.component';
import { ChangeLogListComponent }          from '../../../crm-change-log/components/change-log-list/change-log-list.component';
import { SupportTicketStatusBadgeComponent } from '../../../support-ticket/components/support-ticket-status-badge/support-ticket-status-badge.component';
import { DealSummary }                     from '../../../deal/models/deal.model';
import { Tag }                             from '../../../tag/models/tag.model';
import { SupportTicketSummary }            from '../../../support-ticket/models/support-ticket.model';

/** Union of inline action panels that can be shown on the contact detail page. */
type ActiveAction = 'status' | 'link-org' | 'merge' | null;
/** Tab identifiers for the contact detail tabbed view. */
type ContactTab   = 'activite' | 'actions' | 'deals' | 'tickets' | 'modifications';

@Component({
  selector: 'app-contact-detail',
  providers: [ContactFacade, InteractionFacade],
  imports: [
    ContactInfoCardComponent,
    ContactActionStatusComponent,
    ContactActionLinkOrgComponent,
    ContactActionMergeComponent,
    InteractionTimelineComponent,
    InteractionLogFormComponent,
    CommercialActionCardComponent,
    CommercialActionFormComponent,
    DealActionCreateComponent,
    DealMiniCardComponent,
    CrmEmptyStateComponent,
    TagInputComponent,
    EmailComposeComponent,
    ChangeLogListComponent,
    SupportTicketStatusBadgeComponent,
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
  private readonly authStore   = inject(AuthStore);
  private readonly contactApi  = inject(CrmContactApiService);
  private readonly tagApi      = inject(CrmTagApiService);
  private readonly ticketApi   = inject(CrmSupportTicketApiService);

  readonly activeTab       = signal<ContactTab>('activite');
  readonly activeAction    = signal<ActiveAction>(null);
  readonly showLogForm     = signal(false);
  readonly showActionForm  = signal(false);
  readonly showDealCreate  = signal(false);
  readonly showEmailCompose = signal(false);

  readonly deals          = signal<DealSummary[]>([]);
  readonly dealsLoading   = signal(false);
  readonly tickets        = signal<SupportTicketSummary[]>([]);
  readonly ticketsLoading = signal(false);
  readonly tags           = signal<Tag[]>([]);

  private publicId = '';

  constructor() {
    effect(() => {
      const contact = this.facade.contact();
      if (contact) this.tags.set(contact.tags ?? []);
    });
  }

  get currentUserPublicId(): string { return this.authStore.user()?.publicId ?? ''; }

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId')!;
    this.facade.loadDetail(this.publicId);
    this.loadDeals();
    this.loadTickets();
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

  onActionCreated(): void {
    this.showActionForm.set(false);
    this.facade.actionCreated(this.publicId);
  }

  onDealCreated(): void {
    this.showDealCreate.set(false);
    this.loadDeals();
  }

  onTagAdded(tag: Tag): void {
    this.tagApi.addToContact(tag.publicId, this.publicId).subscribe(() =>
      this.tags.update(list => [...list, tag])
    );
  }

  onTagRemoved(tag: Tag): void {
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
