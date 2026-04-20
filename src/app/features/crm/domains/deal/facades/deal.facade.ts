import { Injectable, inject, signal } from '@angular/core';
import { CrmDealApiService }             from '../services/crm-deal-api.service';
import { CrmCommercialActionApiService } from '../../commercial-action/services/crm-commercial-action-api.service';
import { FeedbackService }               from '../../../../../shared/feedback/tools/feedback.service';
import { InteractionFacade }             from '../../interaction/facades/interaction.facade';
import {
  DealDetail, DealSummary, DealFilter,
  UpdateDealRequest, MoveDealStageRequest, ReassignDealRequest,
  AddDealContactRoleRequest, UpdateDealContactRoleRequest, ContactRole
} from '../models/deal.model';
import { CommercialActionResponse, CompleteCommercialActionRequest } from '../../commercial-action/models/commercial-action.model';
import { Page } from '../../../shared/models/page.model';

/**
 * Facade managing deal list and detail state.
 * Holds signal-based pagination, detail, and commercial action sub-state.
 * Provided at component level (not root) to support multiple independent instances.
 */
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

  /** Loads a paginated, filtered deal list and updates list signals. */
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

  /** Loads a deal detail, its interaction timeline, and its commercial actions. */
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

  /** Updates a deal's editable fields and refreshes the detail signal. */
  update(publicId: string, body: UpdateDealRequest): void {
    this.api.update(publicId, body).subscribe({
      next: d => { this._deal.set(d); this.feedback.showSuccess('Deal mis à jour.'); },
      error: () => this.feedback.showError('Mise à jour impossible.')
    });
  }

  /** Moves a deal to a different pipeline stage and refreshes the detail signal. */
  moveStage(publicId: string, body: MoveDealStageRequest): void {
    this.api.moveStage(publicId, body).subscribe({
      next: d => { this._deal.set(d); this.feedback.showSuccess('Étape mise à jour.'); },
      error: () => this.feedback.showError('Déplacement impossible.')
    });
  }

  /** Reassigns a deal to another commercial and refreshes the detail signal. */
  reassign(publicId: string, body: ReassignDealRequest): void {
    this.api.reassign(publicId, body).subscribe({
      next: d => { this._deal.set(d); this.feedback.showSuccess('Deal réassigné.'); },
      error: () => this.feedback.showError('Réassignation impossible.')
    });
  }

  // ─── Actions (commercial actions for this deal) ────────────────────────────

  /** Loads commercial actions linked to a deal and updates the actions signal. */
  loadActions(dealPublicId: string): void {
    this._actionsLoading.set(true);
    this.caApi.getByDeal(dealPublicId).subscribe({
      next: items => { this._actions.set(items); this._actionsLoading.set(false); },
      error: ()    => { this._actionsLoading.set(false); this.feedback.showError('Chargement des actions impossible.'); }
    });
  }

  /** Marks a commercial action as completed and refreshes the interaction timeline. */
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

  /** Cancels a commercial action and removes it from the actions signal. */
  cancelAction(publicId: string): void {
    this.caApi.cancel(publicId).subscribe({
      next:  () => this._actions.update(list => list.filter(a => a.publicId !== publicId)),
      error: () => this.feedback.showError('Impossible d\'annuler l\'action.')
    });
  }

  /** Reloads commercial actions after a new action has been created. */
  actionCreated(dealPublicId: string): void {
    this.loadActions(dealPublicId);
  }

  // ─── Contact role operations ───────────────────────────────────────────────

  /** Adds a contact with a role to a deal and reloads the detail. */
  addContact(dealPublicId: string, body: AddDealContactRoleRequest): void {
    this.api.addContact(dealPublicId, body).subscribe({
      next: () => { this.loadDetail(dealPublicId); this.feedback.showSuccess('Contact ajouté au deal.'); },
      error: () => this.feedback.showError('Impossible d\'ajouter le contact.')
    });
  }

  /** Removes a contact from a deal and reloads the detail. */
  removeContact(dealPublicId: string, contactPublicId: string): void {
    this.api.removeContact(dealPublicId, contactPublicId).subscribe({
      next: () => { this.loadDetail(dealPublicId); this.feedback.showSuccess('Contact retiré du deal.'); },
      error: () => this.feedback.showError('Impossible de retirer le contact.')
    });
  }

  /** Updates a contact's role on the deal and patches the contacts list in the detail signal. */
  updateContactRole(dealPublicId: string, contactPublicId: string, role: ContactRole): void {
    this.api.updateContactRole(dealPublicId, contactPublicId, { role }).subscribe({
      next: roleResp => {
        this._deal.update(d => d ? {
          ...d,
          contacts: d.contacts.map(c => c.contactPublicId === contactPublicId ? roleResp : c)
        } : d);
        this.feedback.showSuccess('Rôle mis à jour.');
      },
      error: () => this.feedback.showError('Impossible de mettre à jour le rôle.')
    });
  }

  /** Sets the primary contact on a deal and reloads the detail. */
  setPrimaryContact(dealPublicId: string, contactPublicId: string): void {
    this.api.setPrimaryContact(dealPublicId, contactPublicId).subscribe({
      next: () => { this.loadDetail(dealPublicId); this.feedback.showSuccess('Contact principal mis à jour.'); },
      error: () => this.feedback.showError('Impossible de définir le contact principal.')
    });
  }
}
