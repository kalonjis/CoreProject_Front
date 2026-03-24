import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ContactFacade }    from '../../facades/contact.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { AuthStore }        from '../../../../../../core/auth/state/auth.store';
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

type ActiveAction = 'assign' | 'status' | 'link-org' | 'merge' | null;

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
    DealActionCreateComponent
  ],
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.scss'
})
export class ContactDetailComponent implements OnInit {

  readonly facade            = inject(ContactFacade);
  readonly interactionFacade = inject(InteractionFacade);

  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly authStore = inject(AuthStore);

  readonly activeAction   = signal<ActiveAction>(null);
  readonly showLogForm    = signal(false);
  readonly showActionForm = signal(false);
  readonly showDealCreate = signal(false);

  private publicId = '';

  get currentUserPublicId(): string { return this.authStore.user()?.publicId ?? ''; }

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId')!;
    this.facade.loadDetail(this.publicId);
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

  onDealCreated(): void { this.showDealCreate.set(false); }

  goEdit(): void { this.router.navigate(['/crm/contacts', this.publicId, 'edit']); }
  back(): void   { this.router.navigate(['/crm/contacts']); }
}
