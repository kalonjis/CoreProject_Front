import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { ContactDetail } from '../../models/contact.model';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ContactInfoCardComponent } from '../../components/contact-info-card/contact-info-card.component';
import { ContactActionAssignComponent } from '../../components/contact-action-assign/contact-action-assign.component';
import { ContactActionStatusComponent } from '../../components/contact-action-status/contact-action-status.component';
import { ContactActionLinkOrgComponent } from '../../components/contact-action-link-org/contact-action-link-org.component';
import { ContactActionMergeComponent } from '../../components/contact-action-merge/contact-action-merge.component';
import { InteractionTimelineComponent } from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { InteractionLogFormComponent } from '../../../interaction/components/interaction-log-form/interaction-log-form.component';
import { CrmInteractionApiService } from '../../../interaction/services/crm-interaction-api.service';
import { InteractionResponse } from '../../../interaction/models/interaction.model';
import { CommercialActionCardComponent } from '../../../commercial-action/components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent } from '../../../commercial-action/components/commercial-action-form/commercial-action-form.component';
import { CrmCommercialActionApiService } from '../../../commercial-action/services/crm-commercial-action-api.service';
import { CommercialActionResponse } from '../../../commercial-action/models/commercial-action.model';
import { AuthStore } from '../../../../../../core/auth/state/auth.store';

type ActiveAction = 'assign' | 'status' | 'link-org' | 'merge' | null;

@Component({
  selector: 'app-contact-detail',
  imports: [
    ContactInfoCardComponent,
    ContactActionAssignComponent,
    ContactActionStatusComponent,
    ContactActionLinkOrgComponent,
    ContactActionMergeComponent,
    InteractionTimelineComponent,
    InteractionLogFormComponent,
    CommercialActionCardComponent,
    CommercialActionFormComponent
  ],
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.scss'
})
export class ContactDetailComponent implements OnInit {

  private readonly api            = inject(CrmContactApiService);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly feedback       = inject(FeedbackService);
  private readonly interactionApi = inject(CrmInteractionApiService);
  private readonly commercialApi  = inject(CrmCommercialActionApiService);
  private readonly authStore      = inject(AuthStore);

  readonly contact            = signal<ContactDetail | null>(null);
  readonly loading            = signal(false);
  readonly error              = signal<string | null>(null);
  readonly activeAction       = signal<ActiveAction>(null);
  readonly interactions       = signal<InteractionResponse[]>([]);
  readonly timelineLoading    = signal(false);
  readonly showLogForm        = signal(false);
  readonly commercialActions  = signal<CommercialActionResponse[]>([]);
  readonly actionsLoading     = signal(false);
  readonly showActionForm     = signal(false);

  get currentUserPublicId(): string { return this.authStore.user()?.publicId ?? ''; }

  private publicId = '';

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId')!;
    this.loadContact();
    this.loadTimeline();
    this.loadActions();
  }

  private loadContact(): void {
    this.loading.set(true);
    this.api.getByPublicId(this.publicId).subscribe({
      next: c => { this.contact.set(c); this.loading.set(false); },
      error: () => { this.error.set('Contact introuvable.'); this.loading.set(false); }
    });
  }

  loadTimeline(): void {
    this.timelineLoading.set(true);
    this.interactionApi.getTimelineByContact(this.publicId).subscribe({
      next: items => { this.interactions.set(items); this.timelineLoading.set(false); },
      error: ()    => this.timelineLoading.set(false)
    });
  }

  back(): void { this.router.navigate(['/crm/contacts']); }

  goEdit(): void { this.router.navigate(['/crm/contacts', this.publicId, 'edit']); }

  toggleAction(action: ActiveAction): void {
    this.activeAction.set(this.activeAction() === action ? null : action);
  }

  onActionDone(): void {
    this.activeAction.set(null);
    this.loadContact();
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
    this.commercialApi.getByContact(this.publicId).subscribe({
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
}
