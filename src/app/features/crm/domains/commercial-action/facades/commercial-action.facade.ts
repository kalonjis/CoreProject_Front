import { Injectable, inject, signal } from '@angular/core';
import { CrmCommercialActionApiService } from '../services/crm-commercial-action-api.service';
import { FeedbackService }               from '../../../../../shared/feedback/tools/feedback.service';
import {
  CommercialActionResponse,
  CommercialActionStatus,
  CompleteCommercialActionRequest
} from '../models/commercial-action.model';

/**
 * Facade managing the current user's commercial action list.
 * Holds a reactive signal-based state (actions, loading, filter)
 * and delegates API calls to {@link CrmCommercialActionApiService}.
 */
@Injectable({ providedIn: 'root' })
export class CommercialActionFacade {

  private readonly api      = inject(CrmCommercialActionApiService);
  private readonly feedback = inject(FeedbackService);

  private readonly _actions = signal<CommercialActionResponse[]>([]);
  private readonly _loading = signal(false);
  private readonly _filter  = signal<CommercialActionStatus | undefined>(CommercialActionStatus.PENDING);

  readonly actions = this._actions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly filter  = this._filter.asReadonly();

  /** Loads the current user's actions from the API using the active filter. */
  load(): void {
    this._loading.set(true);
    this.api.getMyActions(this._filter()).subscribe({
      next:  items => { this._actions.set(items); this._loading.set(false); },
      error: ()    => { this._loading.set(false); this.feedback.showError('Chargement des actions impossible.'); }
    });
  }

  /** Updates the active status filter and reloads the action list. */
  setFilter(status: CommercialActionStatus | undefined): void {
    this._filter.set(status);
    this.load();
  }

  /** Marks an action as completed and removes it from the local list on success. */
  complete(publicId: string, details?: CompleteCommercialActionRequest): void {
    this.api.complete(publicId, details).subscribe({
      next: () => {
        this._actions.update(list => list.filter(a => a.publicId !== publicId));
        this.feedback.showSuccess('Action terminée.');
      },
      error: () => this.feedback.showError('Impossible de terminer l\'action.')
    });
  }

  /** Cancels an action and removes it from the local list on success. */
  cancel(publicId: string): void {
    this.api.cancel(publicId).subscribe({
      next:  () => this._actions.update(list => list.filter(a => a.publicId !== publicId)),
      error: () => this.feedback.showError('Impossible d\'annuler l\'action.')
    });
  }
}
