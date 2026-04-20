/**
 * Detail page for a single CRM lead.
 *
 * Displays full lead information and orchestrates inline action panels
 * (enrich, assign, convert, reject, log interaction, create commercial action).
 * Delegates all state management to {@link LeadFacade}.
 */
import { Component, OnInit, inject, signal, computed, effect, HostListener, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { LeadFacade }        from '../../facades/lead.facade';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import { AuthStore }         from '../../../../../../core/auth/state/auth.store';
import { LeadStatus }        from '../../models/lead.model';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { LeadInfoCardComponent }         from '../../components/lead-info-card/lead-info-card.component';
import { LeadActionEnrichComponent }     from '../../components/lead-action-enrich/lead-action-enrich.component';
import { LeadActionRejectComponent }     from '../../components/lead-action-reject/lead-action-reject.component';
import { LeadActionConvertComponent }    from '../../components/lead-action-convert/lead-action-convert.component';
import { InteractionTimelineComponent }  from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { InteractionLogFormComponent }   from '../../../interaction/components/interaction-log-form/interaction-log-form.component';
import { CommercialActionCardComponent, CompleteEvent } from '../../../commercial-action/components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent } from '../../../commercial-action/components/commercial-action-form/commercial-action-form.component';
import { EmailComposeComponent, EmailComposeSubmit } from '../../../../shared/email-compose/email-compose.component';
import { CrmTagApiService }     from '../../../tag/services/crm-tag-api.service';
import { Tag }                  from '../../../tag/models/tag.model';

type ActiveAction = 'enrich' | 'convert' | 'reject' | 'log-interaction' | 'create-action' | null;

@Component({
  selector: 'app-lead-detail',
  providers: [LeadFacade, InteractionFacade],
  imports: [
    RouterLink,
    EmailComposeComponent,
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
  private readonly leadApi   = inject(CrmLeadApiService);
  private readonly tagApi    = inject(CrmTagApiService);
  private readonly elRef     = inject(ElementRef);

  readonly activeAction     = signal<ActiveAction>(null);
  readonly showEmailCompose = signal(false);
  readonly showTagPopover   = signal(false);
  readonly tags             = signal<Tag[]>([]);
  readonly allTags          = signal<Tag[]>([]);
  readonly tagQuery         = signal('');

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

  constructor() {
    effect(() => {
      const lead = this.facade.lead();
      if (lead) this.tags.set(lead.tags ?? []);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) this.showTagPopover.set(false);
  }
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
    this.tagApi.findAll().subscribe(tags => this.allTags.set(tags));
  }

  selectTag(tag: Tag): void {
    this.tagApi.addToLead(tag.publicId, this.publicId).subscribe(() => {
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
    this.tagApi.removeFromLead(tag.publicId, this.publicId).subscribe(() =>
      this.tags.update(list => list.filter(t => t.publicId !== tag.publicId))
    );
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

  onEmailSend(payload: EmailComposeSubmit): void {
    this.leadApi.sendEmail(this.publicId, payload).subscribe({
      next: () => {
        this.showEmailCompose.set(false);
        this.interactionFacade.refresh();
      },
      error: () => this.showEmailCompose.set(false)
    });
  }

  back(): void { this.router.navigate(['/crm/leads']); }
}
