import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DealFacade }                from '../../facades/deal.facade';
import { InteractionFacade }         from '../../../interaction/facades/interaction.facade';
import { AuthStore }                 from '../../../../../../core/auth/state/auth.store';
import { CrmTagApiService }          from '../../../tag/services/crm-tag-api.service';
import { CrmPipelineApiService }     from '../../../pipeline/services/crm-pipeline-api.service';
import { CrmSupportTicketApiService } from '../../../support-ticket/services/crm-support-ticket-api.service';
import { DealActionMoveStageComponent }  from '../../components/deal-action-move-stage/deal-action-move-stage.component';
import { DealActionReassignComponent }   from '../../components/deal-action-reassign/deal-action-reassign.component';
import { DealActionContactsComponent }   from '../../components/deal-action-contacts/deal-action-contacts.component';
import { DealStatusBadgeComponent }      from '../../components/deal-status-badge/deal-status-badge.component';
import { InteractionTimelineComponent }  from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { CommercialActionCardComponent, CompleteEvent } from '../../../commercial-action/components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent } from '../../../commercial-action/components/commercial-action-form/commercial-action-form.component';
import { TagInputComponent }             from '../../../tag/components/tag-input/tag-input.component';
import { ChangeLogListComponent }        from '../../../crm-change-log/components/change-log-list/change-log-list.component';
import { SupportTicketStatusBadgeComponent } from '../../../support-ticket/components/support-ticket-status-badge/support-ticket-status-badge.component';
import { LogNoteModalComponent }    from '../../../interaction/components/modals/log-note-modal/log-note-modal.component';
import { LogCallModalComponent }    from '../../../interaction/components/modals/log-call-modal/log-call-modal.component';
import { LogEmailModalComponent }   from '../../../interaction/components/modals/log-email-modal/log-email-modal.component';
import { LogMeetingModalComponent } from '../../../interaction/components/modals/log-meeting-modal/log-meeting-modal.component';
import { CONTACT_ROLE_LABELS, DealDetail } from '../../models/deal.model';
import { Tag }                             from '../../../tag/models/tag.model';
import { SupportTicketSummary }            from '../../../support-ticket/models/support-ticket.model';
import { Pipeline, PipelineStep }          from '../../../pipeline/models/pipeline.model';
import { CommercialActionResponse, CommercialActionStatus } from '../../../commercial-action/models/commercial-action.model';

type ActionPanel = 'move' | 'reassign' | 'contacts' | null;
type DealTab     = 'activite' | 'contacts' | 'tickets' | 'modifications';
type QuickIntent = 'note' | 'call' | 'email' | 'meeting';

@Component({
  selector: 'app-deal-detail',
  providers: [DealFacade, InteractionFacade],
  imports: [
    DatePipe, CurrencyPipe, RouterLink,
    DealActionMoveStageComponent,
    DealActionReassignComponent,
    DealActionContactsComponent,
    DealStatusBadgeComponent,
    InteractionTimelineComponent,
    CommercialActionCardComponent,
    CommercialActionFormComponent,
    TagInputComponent,
    SupportTicketStatusBadgeComponent,
    ChangeLogListComponent,
    LogNoteModalComponent,
    LogCallModalComponent,
    LogEmailModalComponent,
    LogMeetingModalComponent,
  ],
  templateUrl: './deal-detail.component.html',
  styleUrl: './deal-detail.component.scss'
})
export class DealDetailComponent implements OnInit {

  readonly facade            = inject(DealFacade);
  readonly interactionFacade = inject(InteractionFacade);

  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly authStore   = inject(AuthStore);
  private readonly tagApi      = inject(CrmTagApiService);
  private readonly pipelineApi = inject(CrmPipelineApiService);
  private readonly ticketApi   = inject(CrmSupportTicketApiService);

  readonly activeTab      = signal<DealTab>('activite');
  readonly activeAction   = signal<ActionPanel>(null);
  readonly showActionForm = signal(false);
  readonly tags           = signal<Tag[]>([]);
  readonly tickets        = signal<SupportTicketSummary[]>([]);
  readonly ticketsLoading = signal(false);
  readonly pipeline       = signal<Pipeline | null>(null);
  readonly roleLabels     = CONTACT_ROLE_LABELS;

  readonly showNoteModal    = signal(false);
  readonly showCallModal    = signal(false);
  readonly showEmailModal   = signal(false);
  readonly showMeetingModal = signal(false);

  private publicId = '';

  constructor() {
    effect(() => {
      const deal = this.facade.deal();
      if (deal) {
        this.tags.set(deal.tags ?? []);
        this.loadTickets(deal);
        if (!this.pipeline() || this.pipeline()!.publicId !== deal.pipelinePublicId) {
          this.pipelineApi.getByPublicId(deal.pipelinePublicId).subscribe({
            next: p => this.pipeline.set(p)
          });
        }
      }
    });
  }

  get currentUserPublicId(): string { return this.authStore.user()?.publicId ?? ''; }

  get nextPendingAction(): CommercialActionResponse | null {
    const pending = this.facade.actions().filter(a => a.status === CommercialActionStatus.PENDING);
    if (!pending.length) return null;
    return [...pending].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })[0];
  }

  pipelineSteps(): PipelineStep[] {
    return (this.pipeline()?.steps ?? [])
      .filter(s => !s.isLost)
      .sort((a, b) => a.position - b.position);
  }

  isStepDone(step: PipelineStep, deal: DealDetail): boolean {
    const steps = this.pipelineSteps();
    const currentIdx = steps.findIndex(s => s.publicId === deal.stagePublicId);
    const stepIdx    = steps.findIndex(s => s.publicId === step.publicId);
    return stepIdx < currentIdx;
  }

  isStepActive(step: PipelineStep, deal: DealDetail): boolean {
    return step.publicId === deal.stagePublicId;
  }

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
      error: ()   => this.ticketsLoading.set(false)
    });
  }

  setAction(action: ActionPanel): void {
    this.activeAction.set(this.activeAction() === action ? null : action);
  }

  onActionDone(): void {
    this.activeAction.set(null);
    this.facade.loadDetail(this.publicId);
  }

  openQuickAction(intent: QuickIntent): void {
    this.showNoteModal.set(false);
    this.showCallModal.set(false);
    this.showEmailModal.set(false);
    this.showMeetingModal.set(false);
    if (intent === 'note')    this.showNoteModal.set(true);
    if (intent === 'call')    this.showCallModal.set(true);
    if (intent === 'email')   this.showEmailModal.set(true);
    if (intent === 'meeting') this.showMeetingModal.set(true);
  }

  onLogged(): void {
    this.showNoteModal.set(false);
    this.showCallModal.set(false);
    this.showEmailModal.set(false);
    this.showMeetingModal.set(false);
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
