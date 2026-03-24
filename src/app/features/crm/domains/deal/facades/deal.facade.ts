import { Injectable, inject, signal } from '@angular/core';
import { CrmDealApiService }             from '../services/crm-deal-api.service';
import { CrmCommercialActionApiService } from '../../commercial-action/services/crm-commercial-action-api.service';
import { FeedbackService }               from '../../../../../shared/feedback/tools/feedback.service';
import { InteractionFacade }             from '../../interaction/facades/interaction.facade';
import {
  DealDetail, DealSummary, DealFilter,
  UpdateDealRequest, MoveDealStageRequest, ReassignDealRequest
} from '../models/deal.model';
import { CommercialActionResponse, CompleteCommercialActionRequest } from '../../commercial-action/models/commercial-action.model';
import { Page } from '../../../shared/models/page.model';

@Injectable()
export class DealFacade {

  private readonly api               = inject(CrmDealApiService);
  private readonly caApi             = inject(CrmCommercialActionApiService);
  private readonly feedback          = inject(FeedbackService);
  private readonly interactionFacade = inject(InteractionFacade);

  // ─── List state ────────────────────────────────────────────────────────────
  private readonly _deals         = signal<DealSummary[]>([]);
  private readonly _totalPages    = signal(0);
  private readonly _totalElements = signal(0);
  private readonly _listLoading   = signal(false);

  readonly deals         = this._deals.asReadonly();
  readonly totalPages    = this._totalPages.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly listLoading   = this._listLoading.asReadonly();

  // ─── Detail state ──────────────────────────────────────────────────────────
  private readonly _deal           = signal<DealDetail | null>(null);
  private readonly _detailLoading  = signal(false);
  private readonly _actions        = signal<CommercialActionResponse[]>([]);
  private readonly _actionsLoading = signal(false);

  readonly deal           = this._deal.asReadonly();
  readonly detailLoading  = this._detailLoading.asReadonly();
  readonly actions        = this._actions.asReadonly();
  readonly actionsLoading = this._actionsLoading.asReadonly();

  // ─── List operations ───────────────────────────────────────────────────────

  loadList(filter: DealFilter, page: number, size: number): void {
    this._listLoading.set(true);
    this.api.findAll(filter, page, size).subscribe({
      next: (p: Page<DealSummary>) => {
        this._deals.set(p.content);
        this._totalPages.set(p.totalPages);
        this._totalElements.set(p.totalElements);
        this._listLoading.set(false);
      },
      error: () => { this._listLoading.set(false); this.feedback.showError('Chargement des deals impossible.'); }
    });
  }

  // ─── Detail operations ─────────────────────────────────────────────────────

  loadDetail(publicId: string): void {
    this._deal.set(null);
    this._detailLoading.set(true);
    this.api.getByPublicId(publicId).subscribe({
      next: d => {
        this._deal.set(d);
        this._detailLoading.set(false);
        this.interactionFacade.loadFor('deal', publicId);
        this.loadActions(publicId);
      },
      error: () => { this._detailLoading.set(false); this.feedback.showError('Deal introuvable.'); }
    });
  }

  update(publicId: string, body: UpdateDealRequest): void {
    this.api.update(publicId, body).subscribe({
      next: d => { this._deal.set(d); this.feedback.showSuccess('Deal mis à jour.'); },
      error: () => this.feedback.showError('Mise à jour impossible.')
    });
  }

  moveStage(publicId: string, body: MoveDealStageRequest): void {
    this.api.moveStage(publicId, body).subscribe({
      next: d => { this._deal.set(d); this.feedback.showSuccess('Étape mise à jour.'); },
      error: () => this.feedback.showError('Déplacement impossible.')
    });
  }

  reassign(publicId: string, body: ReassignDealRequest): void {
    this.api.reassign(publicId, body).subscribe({
      next: d => { this._deal.set(d); this.feedback.showSuccess('Deal réassigné.'); },
      error: () => this.feedback.showError('Réassignation impossible.')
    });
  }

  // ─── Actions (commercial actions for this deal) ────────────────────────────

  loadActions(dealPublicId: string): void {
    this._actionsLoading.set(true);
    this.caApi.getByDeal(dealPublicId).subscribe({
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

  actionCreated(dealPublicId: string): void {
    this.loadActions(dealPublicId);
  }
}
