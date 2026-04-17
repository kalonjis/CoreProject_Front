/**
 * Detail page for a single CRM lead.
 *
 * Displays full lead information and orchestrates inline action panels
 * (enrich, assign, convert, reject, log interaction, create commercial action).
 * Delegates all state management to {@link LeadFacade}.
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { LeadFacade }        from '../../facades/lead.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { AuthStore }         from '../../../../../../core/auth/state/auth.store';
import { LeadStatus }        from '../../models/lead.model';
import { LeadInfoCardComponent }         from '../../components/lead-info-card/lead-info-card.component';
import { LeadActionEnrichComponent }     from '../../components/lead-action-enrich/lead-action-enrich.component';
import { LeadActionRejectComponent }     from '../../components/lead-action-reject/lead-action-reject.component';
import { LeadActionConvertComponent }    from '../../components/lead-action-convert/lead-action-convert.component';
import { InteractionTimelineComponent }  from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { InteractionLogFormComponent }   from '../../../interaction/components/interaction-log-form/interaction-log-form.component';
import { CommercialActionCardComponent, CompleteEvent } from '../../../commercial-action/components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent } from '../../../commercial-action/components/commercial-action-form/commercial-action-form.component';

type ActiveAction = 'enrich' | 'convert' | 'reject' | 'log-interaction' | 'create-action' | null;

@Component({
  selector: 'app-lead-detail',
  providers: [LeadFacade, InteractionFacade],
  imports: [
    RouterLink,
    LeadInfoCardComponent,
    LeadActionEnrichComponent,
    LeadActionRejectComponent,
    LeadActionConvertComponent,
    InteractionTimelineComponent,
    InteractionLogFormComponent,
    CommercialActionCardComponent,
    CommercialActionFormComponent
  ],
  templateUrl: './lead-detail.component.html',
  styleUrl: './lead-detail.component.scss'
})
export class LeadDetailComponent implements OnInit {

  readonly facade            = inject(LeadFacade);
  readonly interactionFacade = inject(InteractionFacade);

  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly authStore = inject(AuthStore);

  readonly activeAction = signal<ActiveAction>(null);
  readonly LeadStatus   = LeadStatus;

  readonly canMarkInReview = computed(() => {
    const lead = this.facade.lead();
    if (!lead || lead.status !== LeadStatus.NEW) return false;
    if (this.authStore.isAdmin()) return true;
    return lead.assignedToPublicId === this.authStore.user()?.publicId;
  });

  private publicId = '';

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
    this.activeAction.set(null);
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
    this.activeAction.set(null);
    this.facade.actionCreated(this.publicId);
  }

  back(): void { this.router.navigate(['/crm/leads']); }
}
