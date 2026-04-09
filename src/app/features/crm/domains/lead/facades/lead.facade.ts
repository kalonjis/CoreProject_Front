import { Injectable, inject, signal, computed } from '@angular/core';
import { CrmLeadApiService }             from '../services/crm-lead-api.service';
import { CrmCommercialActionApiService } from '../../commercial-action/services/crm-commercial-action-api.service';
import { FeedbackService }               from '../../../../../shared/feedback/tools/feedback.service';
import { InteractionFacade }             from '../../interaction/facades/interaction.facade';
import {
  LeadDetail, LeadSummary, LeadFilter, LeadStatus,
  EnrichLeadRequest, AssignLeadRequest, ConvertLeadRequest, RejectLeadRequest
} from '../models/lead.model';
import { CommercialActionResponse, CompleteCommercialActionRequest } from '../../commercial-action/models/commercial-action.model';
import { Page } from '../../../shared/models/page.model';

@Injectable()
export class LeadFacade {

  private readonly api               = inject(CrmLeadApiService);
  private readonly caApi             = inject(CrmCommercialActionApiService);
  private readonly feedback          = inject(FeedbackService);
  private readonly interactionFacade = inject(InteractionFacade);

  // ─── List state ────────────────────────────────────────────────────────────
  private readonly _leads         = signal<LeadSummary[]>([]);
  private readonly _totalPages    = signal(0);
  private readonly _totalElements = signal(0);
  private readonly _listLoading   = signal(false);

  readonly leads         = this._leads.asReadonly();
  readonly totalPages    = this._totalPages.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly listLoading   = this._listLoading.asReadonly();

  // ─── Detail state ──────────────────────────────────────────────────────────
  private readonly _lead           = signal<LeadDetail | null>(null);
  private readonly _detailLoading  = signal(false);
  private readonly _actionLoading  = signal(false);
  private readonly _actions        = signal<CommercialActionResponse[]>([]);
  private readonly _actionsLoading = signal(false);

  readonly lead           = this._lead.asReadonly();
  readonly detailLoading  = this._detailLoading.asReadonly();
  readonly actionLoading  = this._actionLoading.asReadonly();
  readonly actions        = this._actions.asReadonly();
  readonly actionsLoading = this._actionsLoading.asReadonly();

  readonly isTerminal  = computed(() => {
    const s = this._lead()?.status;
    return s === LeadStatus.CONVERTED || s === LeadStatus.REJECTED;
  });
  readonly canConvert  = computed(() => {
    const lead = this._lead();
    return lead?.status === LeadStatus.IN_REVIEW && !lead?.existingContactPublicId;
  });

  // ─── List operations ───────────────────────────────────────────────────────

  loadList(filter: LeadFilter, page: number, size: number, sort = 'submittedAt', direction: 'asc' | 'desc' = 'desc'): void {
    this._listLoading.set(true);
    this.api.findAll(filter, page, size, sort, direction).subscribe({
      next: (p: Page<LeadSummary>) => {
        this._leads.set(p.content);
        this._totalPages.set(p.totalPages);
        this._totalElements.set(p.totalElements);
        this._listLoading.set(false);
      },
      error: () => { this._listLoading.set(false); this.feedback.showError('Chargement des leads impossible.'); }
    });
  }

  // ─── Detail operations ─────────────────────────────────────────────────────

  loadDetail(publicId: string): void {
    this._lead.set(null);
    this._detailLoading.set(true);
    this.api.getByPublicId(publicId).subscribe({
      next: l => {
        this._lead.set(l);
        this._detailLoading.set(false);
        this.interactionFacade.loadFor('lead', publicId);
        this.loadActions(publicId);
      },
      error: () => { this._detailLoading.set(false); this.feedback.showError('Lead introuvable.'); }
    });
  }

  markInReview(): void {
    const lead = this._lead();
    if (!lead) return;
    this._actionLoading.set(true);
    this.api.markInReview(lead.publicId).subscribe({
      next: updated => { this._lead.set(updated); this._actionLoading.set(false); this.feedback.showSuccess('Lead passé en revue.'); },
      error: ()      => { this._actionLoading.set(false); this.feedback.showError('Impossible de mettre le lead en revue.'); }
    });
  }

  enrich(publicId: string, body: EnrichLeadRequest): void {
    this.api.enrich(publicId, body).subscribe({
      next: l => { this._lead.set(l); this.feedback.showSuccess('Lead enrichi.'); },
      error: () => this.feedback.showError('Enrichissement impossible.')
    });
  }

  assign(publicId: string, body: AssignLeadRequest): void {
    this.api.assign(publicId, body).subscribe({
      next: l => { this._lead.set(l); this.feedback.showSuccess('Lead assigné.'); },
      error: () => this.feedback.showError('Assignation impossible.')
    });
  }

  /** Assigns a lead directly from the list view and updates the list signal in place. */
  assignInList(leadPublicId: string, body: AssignLeadRequest, assignedUsername: string): void {
    this.api.assign(leadPublicId, body).subscribe({
      next: () => {
        this._leads.update(list =>
          list.map(l => l.publicId === leadPublicId ? { ...l, assignedTo: assignedUsername } : l)
        );
        this.feedback.showSuccess('Lead assigné.');
      },
      error: () => this.feedback.showError('Assignation impossible.')
    });
  }

  convert(publicId: string, body: ConvertLeadRequest): void {
    this.api.convert(publicId, body).subscribe({
      next: l => { this._lead.set(l); this.feedback.showSuccess('Lead converti en contact.'); },
      error: () => this.feedback.showError('Conversion impossible.')
    });
  }

  reject(publicId: string, body: RejectLeadRequest): void {
    this.api.reject(publicId, body).subscribe({
      next: l => { this._lead.set(l); this.feedback.showSuccess('Lead rejeté.'); },
      error: () => this.feedback.showError('Rejet impossible.')
    });
  }

  // ─── Actions (commercial actions for this lead) ────────────────────────────

  loadActions(leadPublicId: string): void {
    this._actionsLoading.set(true);
    this.caApi.getByLead(leadPublicId).subscribe({
      next: items => { this._actions.set(items); this._actionsLoading.set(false); },
      error: ()    => { this._actionsLoading.set(false); this.feedback.showError('Chargement des actions impossible.'); }
    });
  }

  completeAction(publicId: string, details?: CompleteCommercialActionRequest): void {
    this.caApi.complete(publicId, details).subscribe({
      next: () => {
        this._actions.update(list => list.filter(a => a.publicId !== publicId));
        this.interactionFacade.refresh();
        this.feedback.showSuccess('Action terminée.');
      },
      error: () => this.feedback.showError('Impossible de terminer l\'action.')
    });
  }

  cancelAction(publicId: string): void {
    this.caApi.cancel(publicId).subscribe({
      next:  () => this._actions.update(list => list.filter(a => a.publicId !== publicId)),
      error: () => this.feedback.showError('Impossible d\'annuler l\'action.')
    });
  }

  actionCreated(leadPublicId: string): void {
    this.loadActions(leadPublicId);
  }
}
