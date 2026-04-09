import { Injectable, inject, signal } from '@angular/core';
import { CrmContactApiService }      from '../services/crm-contact-api.service';
import { CrmCommercialActionApiService } from '../../commercial-action/services/crm-commercial-action-api.service';
import { FeedbackService }           from '../../../../../shared/feedback/tools/feedback.service';
import { InteractionFacade }         from '../../interaction/facades/interaction.facade';
import {
  ContactDetail, ContactSummary, ContactFilter,
  UpdateContactRequest, UpdateContactStatusRequest,
  AssignContactRequest, LinkContactOrganisationRequest, MergeContactRequest
} from '../models/contact.model';
import { CommercialActionResponse, CompleteCommercialActionRequest } from '../../commercial-action/models/commercial-action.model';
import { Page } from '../../../shared/models/page.model';

@Injectable()
export class ContactFacade {

  private readonly api               = inject(CrmContactApiService);
  private readonly caApi             = inject(CrmCommercialActionApiService);
  private readonly feedback          = inject(FeedbackService);
  private readonly interactionFacade = inject(InteractionFacade);

  // ─── List state ────────────────────────────────────────────────────────────
  private readonly _contacts      = signal<ContactSummary[]>([]);
  private readonly _totalPages    = signal(0);
  private readonly _totalElements = signal(0);
  private readonly _listLoading   = signal(false);

  readonly contacts      = this._contacts.asReadonly();
  readonly totalPages    = this._totalPages.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly listLoading   = this._listLoading.asReadonly();

  // ─── Detail state ──────────────────────────────────────────────────────────
  private readonly _contact        = signal<ContactDetail | null>(null);
  private readonly _detailLoading  = signal(false);
  private readonly _actions        = signal<CommercialActionResponse[]>([]);
  private readonly _actionsLoading = signal(false);

  readonly contact        = this._contact.asReadonly();
  readonly detailLoading  = this._detailLoading.asReadonly();
  readonly actions        = this._actions.asReadonly();
  readonly actionsLoading = this._actionsLoading.asReadonly();

  // ─── List operations ───────────────────────────────────────────────────────

  loadList(filter: ContactFilter, page: number, size: number, sort = 'lastName', direction: 'asc' | 'desc' = 'asc'): void {
    this._listLoading.set(true);
    this.api.findAll(filter, page, size, sort, direction).subscribe({
      next: (p: Page<ContactSummary>) => {
        this._contacts.set(p.content);
        this._totalPages.set(p.totalPages);
        this._totalElements.set(p.totalElements);
        this._listLoading.set(false);
      },
      error: () => { this._listLoading.set(false); this.feedback.showError('Chargement des contacts impossible.'); }
    });
  }

  // ─── Detail operations ─────────────────────────────────────────────────────

  loadDetail(publicId: string): void {
    this._contact.set(null);
    this._detailLoading.set(true);
    this.api.getByPublicId(publicId).subscribe({
      next: c => {
        this._contact.set(c);
        this._detailLoading.set(false);
        this.interactionFacade.loadFor('contact', publicId);
        this.loadActions(publicId);
      },
      error: () => { this._detailLoading.set(false); this.feedback.showError('Contact introuvable.'); }
    });
  }

  update(publicId: string, body: UpdateContactRequest): void {
    this.api.update(publicId, body).subscribe({
      next: c => { this._contact.set(c); this.feedback.showSuccess('Contact mis à jour.'); },
      error: () => this.feedback.showError('Mise à jour impossible.')
    });
  }

  updateStatus(publicId: string, body: UpdateContactStatusRequest): void {
    this.api.updateStatus(publicId, body).subscribe({
      next: c => { this._contact.set(c); this.feedback.showSuccess('Statut mis à jour.'); },
      error: () => this.feedback.showError('Changement de statut impossible.')
    });
  }

  assign(publicId: string, body: AssignContactRequest): void {
    this.api.assign(publicId, body).subscribe({
      next: c => { this._contact.set(c); this.feedback.showSuccess('Contact réassigné.'); },
      error: () => this.feedback.showError('Réassignation impossible.')
    });
  }

  /** Updates the organisation of a contact in the list signal in place, without a full reload. */
  updateOrgInList(contactPublicId: string, orgPublicId: string, orgName: string): void {
    this._contacts.update(list =>
      list.map(c => c.publicId === contactPublicId
        ? { ...c, organisationPublicId: orgPublicId, organisationName: orgName }
        : c)
    );
  }

  /** Assigns a contact directly from the list view and updates the list signal in place. */
  assignInList(contactPublicId: string, body: AssignContactRequest, assignedUsername: string): void {
    this.api.assign(contactPublicId, body).subscribe({
      next: () => {
        this._contacts.update(list =>
          list.map(c => c.publicId === contactPublicId ? { ...c, assignedTo: assignedUsername } : c)
        );
        this.feedback.showSuccess('Contact assigné.');
      },
      error: () => this.feedback.showError('Assignation impossible.')
    });
  }

  linkOrganisation(publicId: string, body: LinkContactOrganisationRequest): void {
    this.api.linkOrganisation(publicId, body).subscribe({
      next: c => { this._contact.set(c); this.feedback.showSuccess('Organisation liée.'); },
      error: () => this.feedback.showError('Liaison impossible.')
    });
  }

  merge(body: MergeContactRequest): void {
    this.api.merge(body).subscribe({
      next: c => { this._contact.set(c); this.feedback.showSuccess('Contacts fusionnés.'); },
      error: () => this.feedback.showError('Fusion impossible.')
    });
  }

  // ─── Actions (commercial actions for this contact) ─────────────────────────

  loadActions(contactPublicId: string): void {
    this._actionsLoading.set(true);
    this.caApi.getByContact(contactPublicId).subscribe({
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

  actionCreated(contactPublicId: string): void {
    this.loadActions(contactPublicId);
  }
}
