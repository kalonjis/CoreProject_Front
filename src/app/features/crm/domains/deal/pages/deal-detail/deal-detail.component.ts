import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DealFacade }         from '../../facades/deal.facade';
import { InteractionFacade }  from '../../../interaction/facades/interaction.facade';
import { AuthStore }          from '../../../../../../core/auth/state/auth.store';
import { DealInfoCardComponent }          from '../../components/deal-info-card/deal-info-card.component';
import { DealActionMoveStageComponent }   from '../../components/deal-action-move-stage/deal-action-move-stage.component';
import { DealActionReassignComponent }    from '../../components/deal-action-reassign/deal-action-reassign.component';
import { InteractionTimelineComponent }   from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { InteractionLogFormComponent }    from '../../../interaction/components/interaction-log-form/interaction-log-form.component';
import { CommercialActionCardComponent, CompleteEvent } from '../../../commercial-action/components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent }  from '../../../commercial-action/components/commercial-action-form/commercial-action-form.component';

type ActionPanel = 'move' | 'reassign' | null;

@Component({
  selector: 'app-deal-detail',
  providers: [DealFacade, InteractionFacade],
  imports: [
    RouterLink,
    DealInfoCardComponent,
    DealActionMoveStageComponent,
    DealActionReassignComponent,
    InteractionTimelineComponent,
    InteractionLogFormComponent,
    CommercialActionCardComponent,
    CommercialActionFormComponent
  ],
  templateUrl: './deal-detail.component.html',
  styleUrl: './deal-detail.component.scss'
})
export class DealDetailComponent implements OnInit {

  readonly facade            = inject(DealFacade);
  readonly interactionFacade = inject(InteractionFacade);

  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly authStore = inject(AuthStore);

  readonly activeAction   = signal<ActionPanel>(null);
  readonly showLogForm    = signal(false);
  readonly showActionForm = signal(false);

  private publicId = '';

  get currentUserPublicId(): string { return this.authStore.user()?.publicId ?? ''; }

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.facade.loadDetail(this.publicId);
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

  goEdit(): void { this.router.navigate(['/crm/deals', this.publicId, 'edit']); }
}
