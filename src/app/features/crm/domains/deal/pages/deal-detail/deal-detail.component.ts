import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CrmDealApiService } from '../../services/crm-deal-api.service';
import { DealDetail } from '../../models/deal.model';
import { DealInfoCardComponent } from '../../components/deal-info-card/deal-info-card.component';
import { DealActionMoveStageComponent } from '../../components/deal-action-move-stage/deal-action-move-stage.component';
import { DealActionReassignComponent } from '../../components/deal-action-reassign/deal-action-reassign.component';
import { InteractionTimelineComponent } from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { InteractionLogFormComponent } from '../../../interaction/components/interaction-log-form/interaction-log-form.component';
import { CrmInteractionApiService } from '../../../interaction/services/crm-interaction-api.service';
import { InteractionResponse } from '../../../interaction/models/interaction.model';
import { CommercialActionCardComponent } from '../../../commercial-action/components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent } from '../../../commercial-action/components/commercial-action-form/commercial-action-form.component';
import { CrmCommercialActionApiService } from '../../../commercial-action/services/crm-commercial-action-api.service';
import { CommercialActionResponse } from '../../../commercial-action/models/commercial-action.model';
import { AuthStore } from '../../../../../../core/auth/state/auth.store';

type ActionPanel = 'move' | 'reassign' | null;

@Component({
  selector: 'app-deal-detail',
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

  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly api              = inject(CrmDealApiService);
  private readonly interactionApi   = inject(CrmInteractionApiService);
  private readonly commercialApi    = inject(CrmCommercialActionApiService);
  private readonly authStore        = inject(AuthStore);

  readonly deal               = signal<DealDetail | null>(null);
  readonly loading            = signal(false);
  readonly error              = signal<string | null>(null);
  readonly activeAction       = signal<ActionPanel>(null);
  readonly interactions       = signal<InteractionResponse[]>([]);
  readonly timelineLoading    = signal(false);
  readonly showLogForm        = signal(false);
  readonly commercialActions  = signal<CommercialActionResponse[]>([]);
  readonly actionsLoading     = signal(false);
  readonly showActionForm     = signal(false);

  get currentUserPublicId(): string { return this.authStore.user()?.publicId ?? ''; }

  private publicId = '';

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.load();
    this.loadTimeline();
    this.loadActions();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getByPublicId(this.publicId).subscribe({
      next: deal => { this.deal.set(deal); this.loading.set(false); },
      error: () => { this.error.set('Deal introuvable.'); this.loading.set(false); }
    });
  }

  loadTimeline(): void {
    this.timelineLoading.set(true);
    this.interactionApi.getTimelineByDeal(this.publicId).subscribe({
      next: items => { this.interactions.set(items); this.timelineLoading.set(false); },
      error: ()    => this.timelineLoading.set(false)
    });
  }

  setAction(action: ActionPanel): void {
    this.activeAction.set(this.activeAction() === action ? null : action);
  }

  onActionDone(): void {
    this.activeAction.set(null);
    this.load();
  }

  onInteractionLogged(): void {
    this.showLogForm.set(false);
    this.loadTimeline();
  }

  onInteractionDelete(interactionPublicId: string): void {
    this.interactionApi.delete(interactionPublicId).subscribe({
      next: () => this.loadTimeline()
    });
  }

  loadActions(): void {
    this.actionsLoading.set(true);
    this.commercialApi.getByDeal(this.publicId).subscribe({
      next: items => { this.commercialActions.set(items); this.actionsLoading.set(false); },
      error: ()    => this.actionsLoading.set(false)
    });
  }

  onActionCreated(): void {
    this.showActionForm.set(false);
    this.loadActions();
  }

  onActionComplete(publicId: string): void {
    this.commercialApi.complete(publicId).subscribe({ next: () => this.loadActions() });
  }

  onActionCancel(publicId: string): void {
    this.commercialApi.cancel(publicId).subscribe({ next: () => this.loadActions() });
  }

  goEdit(): void { this.router.navigate(['/crm/deals', this.publicId, 'edit']); }
}
