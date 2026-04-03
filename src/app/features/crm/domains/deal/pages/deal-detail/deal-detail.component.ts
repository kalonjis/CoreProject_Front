import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DealFacade }         from '../../facades/deal.facade';
import { InteractionFacade }  from '../../../interaction/facades/interaction.facade';
import { AuthStore }          from '../../../../../../core/auth/state/auth.store';
import { CrmTagApiService }                from '../../../tag/services/crm-tag-api.service';
import { DealInfoCardComponent }          from '../../components/deal-info-card/deal-info-card.component';
import { DealActionMoveStageComponent }   from '../../components/deal-action-move-stage/deal-action-move-stage.component';
import { DealActionReassignComponent }    from '../../components/deal-action-reassign/deal-action-reassign.component';
import { DealActionContactsComponent }    from '../../components/deal-action-contacts/deal-action-contacts.component';
import { InteractionTimelineComponent }   from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { InteractionLogFormComponent }    from '../../../interaction/components/interaction-log-form/interaction-log-form.component';
import { CommercialActionCardComponent, CompleteEvent } from '../../../commercial-action/components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent }  from '../../../commercial-action/components/commercial-action-form/commercial-action-form.component';
import { TagInputComponent }              from '../../../tag/components/tag-input/tag-input.component';
import { EmailComposeComponent, EmailComposeSubmit } from '../../../../shared/email-compose/email-compose.component';
import { ChangeLogListComponent }         from '../../../crm-change-log/components/change-log-list/change-log-list.component';
import { CrmContactApiService }           from '../../../contact/services/crm-contact-api.service';
import { CrmSupportTicketApiService }     from '../../../support-ticket/services/crm-support-ticket-api.service';
import { SupportTicketSummary }           from '../../../support-ticket/models/support-ticket.model';
import { SupportTicketStatusBadgeComponent } from '../../../support-ticket/components/support-ticket-status-badge/support-ticket-status-badge.component';
import { CONTACT_ROLE_LABELS }            from '../../models/deal.model';
import { Tag }                            from '../../../tag/models/tag.model';
import { DealDetail }                     from '../../models/deal.model';

type ActionPanel = 'move' | 'reassign' | 'contacts' | null;
type DealTab     = 'activite' | 'contacts' | 'tickets' | 'modifications';

@Component({
  selector: 'app-deal-detail',
  providers: [DealFacade, InteractionFacade],
  imports: [
    DatePipe,
    RouterLink,
    DealInfoCardComponent,
    DealActionMoveStageComponent,
    DealActionReassignComponent,
    DealActionContactsComponent,
    InteractionTimelineComponent,
    InteractionLogFormComponent,
    CommercialActionCardComponent,
    CommercialActionFormComponent,
    TagInputComponent,
    EmailComposeComponent,
    SupportTicketStatusBadgeComponent,
    ChangeLogListComponent
  ],
  templateUrl: './deal-detail.component.html',
  styleUrl: './deal-detail.component.scss'
})
export class DealDetailComponent implements OnInit {

  readonly facade            = inject(DealFacade);
  readonly interactionFacade = inject(InteractionFacade);

  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly authStore  = inject(AuthStore);
  private readonly tagApi     = inject(CrmTagApiService);
  private readonly contactApi = inject(CrmContactApiService);
  private readonly ticketApi  = inject(CrmSupportTicketApiService);

  readonly activeTab        = signal<DealTab>('activite');
  readonly activeAction     = signal<ActionPanel>(null);
  readonly showLogForm      = signal(false);
  readonly showActionForm   = signal(false);
  readonly showEmailCompose = signal(false);
  readonly tags             = signal<Tag[]>([]);
  readonly tickets          = signal<SupportTicketSummary[]>([]);
  readonly ticketsLoading   = signal(false);
  readonly roleLabels       = CONTACT_ROLE_LABELS;

  private publicId = '';

  constructor() {
    effect(() => {
      const deal = this.facade.deal();
      if (deal) {
        this.tags.set(deal.tags ?? []);
        this.loadTickets(deal);
      }
    });
  }

  get currentUserPublicId(): string { return this.authStore.user()?.publicId ?? ''; }

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.facade.loadDetail(this.publicId);
  }

  private loadTickets(deal: DealDetail): void {
    this.ticketsLoading.set(true);
    const filter = deal.organisationPublicId
      ? { organisationPublicId: deal.organisationPublicId }
      : deal.contactPublicId
        ? { contactPublicId: deal.contactPublicId }
        : {};

    this.ticketApi.findAll(filter, 0, 50).subscribe({
      next: page => { this.tickets.set(page.content); this.ticketsLoading.set(false); },
      error: ()  => this.ticketsLoading.set(false)
    });
  }

  setAction(action: ActionPanel): void {
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

  onEmailSend(payload: EmailComposeSubmit): void {
    const deal = this.facade.deal();
    if (!deal?.contactPublicId) return;
    this.contactApi.sendEmail(deal.contactPublicId, { ...payload, dealPublicId: this.publicId }).subscribe({
      next: () => {
        this.showEmailCompose.set(false);
        this.interactionFacade.refresh();
      },
      error: () => this.showEmailCompose.set(false)
    });
  }

  onTagAdded(tag: Tag): void {
    this.tagApi.addToDeal(tag.publicId, this.publicId).subscribe(() =>
      this.tags.update(list => [...list, tag])
    );
  }

  onTagRemoved(tag: Tag): void {
    this.tagApi.removeFromDeal(tag.publicId, this.publicId).subscribe(() =>
      this.tags.update(list => list.filter(t => t.publicId !== tag.publicId))
    );
  }

  goEdit(): void { this.router.navigate(['/crm/deals', this.publicId, 'edit']); }
}
