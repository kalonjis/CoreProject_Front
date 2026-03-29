import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ContactFacade }    from '../../facades/contact.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { AuthStore }        from '../../../../../../core/auth/state/auth.store';
import { CrmContactApiService }            from '../../services/crm-contact-api.service';
import { CrmTagApiService }                from '../../../tag/services/crm-tag-api.service';
import { ContactInfoCardComponent }        from '../../components/contact-info-card/contact-info-card.component';
import { ContactActionAssignComponent }    from '../../components/contact-action-assign/contact-action-assign.component';
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
import { DealSummary }                     from '../../../deal/models/deal.model';
import { Tag }                             from '../../../tag/models/tag.model';

type ActiveAction = 'assign' | 'status' | 'link-org' | 'merge' | null;
type ContactTab   = 'activite' | 'actions' | 'deals' | 'modifications';

@Component({
  selector: 'app-contact-detail',
  providers: [ContactFacade, InteractionFacade],
  imports: [
    ContactInfoCardComponent,
    ContactActionAssignComponent,
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
    ChangeLogListComponent
  ],
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.scss'
})
export class ContactDetailComponent implements OnInit {

  readonly facade            = inject(ContactFacade);
  readonly interactionFacade = inject(InteractionFacade);

  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly authStore   = inject(AuthStore);
  private readonly contactApi  = inject(CrmContactApiService);
  private readonly tagApi      = inject(CrmTagApiService);

  readonly activeTab       = signal<ContactTab>('activite');
  readonly activeAction    = signal<ActiveAction>(null);
  readonly showLogForm     = signal(false);
  readonly showActionForm  = signal(false);
  readonly showDealCreate  = signal(false);
  readonly showEmailCompose = signal(false);

  readonly deals        = signal<DealSummary[]>([]);
  readonly dealsLoading = signal(false);
  readonly tags         = signal<Tag[]>([]);

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
  }

  private loadDeals(): void {
    this.dealsLoading.set(true);
    this.contactApi.getDeals(this.publicId).subscribe({
      next: d  => { this.deals.set(d); this.dealsLoading.set(false); },
      error: () => this.dealsLoading.set(false)
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

  goEdit(): void { this.router.navigate(['/crm/contacts', this.publicId, 'edit']); }
  back(): void   { this.router.navigate(['/crm/contacts']); }
}
