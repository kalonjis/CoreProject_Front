import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CrmCommercialActionApiService }          from '../../services/crm-commercial-action-api.service';
import { FeedbackService }                        from '../../../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService }                   from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import {
  CommercialActionResponse,
  CommercialActionStatus,
  CompleteCommercialActionRequest,
  COMMERCIAL_ACTION_TYPE_LABELS,
  requiresCalendarSlot
} from '../../models/commercial-action.model';
import { CommercialActionFormComponent }          from '../../components/commercial-action-form/commercial-action-form.component';
import { CommercialActionStatusBadgeComponent }   from '../../components/commercial-action-status-badge/commercial-action-status-badge.component';
import { CommercialActionPriorityBadgeComponent } from '../../components/commercial-action-priority-badge/commercial-action-priority-badge.component';
import { CommercialActionCompleteFormComponent }  from '../../components/commercial-action-complete-form/commercial-action-complete-form.component';

@Component({
  selector: 'app-commercial-action-detail',
  imports: [
    RouterLink,
    DatePipe,
    CommercialActionFormComponent,
    CommercialActionStatusBadgeComponent,
    CommercialActionPriorityBadgeComponent,
    CommercialActionCompleteFormComponent
  ],
  templateUrl: './commercial-action-detail.component.html',
  styleUrl:    './commercial-action-detail.component.scss'
})
/** Page component displaying the full details of a single commercial action with edit, complete, and cancel capabilities. */
export class CommercialActionDetailComponent implements OnInit {

  private readonly route    = inject(ActivatedRoute);
  private readonly api      = inject(CrmCommercialActionApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly confirm  = inject(ConfirmDialogService);

  /** The loaded commercial action, or null while loading. */
  readonly action           = signal<CommercialActionResponse | null>(null);
  /** True while the detail is being fetched. */
  readonly loading          = signal(false);
  /** Controls visibility of the inline edit form. */
  readonly showEditModal    = signal(false);
  /** Controls visibility of the completion form modal. */
  readonly showCompleteModal = signal(false);

  /** Exposed to the template for status comparisons. */
  readonly CommercialActionStatus = CommercialActionStatus;
  /** Exposed to the template to show calendar-related fields conditionally. */
  readonly requiresCalendarSlot   = requiresCalendarSlot;
  /** Human-readable type labels for the template. */
  readonly TYPE_LABELS            = COMMERCIAL_ACTION_TYPE_LABELS;

  private publicId = '';

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.load();
  }

  /** Fetches the commercial action detail from the API. */
  load(): void {
    this.loading.set(true);
    this.api.getByPublicId(this.publicId).subscribe({
      next:  a  => { this.action.set(a); this.loading.set(false); },
      error: () => { this.loading.set(false); this.feedback.showError('Action introuvable.'); }
    });
  }

  /** Closes the edit form and reloads the action after a successful update. */
  onEdited(): void {
    this.showEditModal.set(false);
    this.load();
  }

  /** Submits the completion request and reloads the action on success. */
  onConfirmed(details: CompleteCommercialActionRequest | undefined): void {
    this.showCompleteModal.set(false);
    const a = this.action();
    if (!a) return;
    this.api.complete(a.publicId, details).subscribe({
      next:  () => { this.load(); this.feedback.showSuccess('Action terminée.'); },
      error: () => this.feedback.showError('Impossible de terminer l\'action.')
    });
  }

  /** Prompts for confirmation then cancels the action. */
  onCancel(): void {
    const a = this.action();
    if (!a) return;
    this.confirm.confirm({
      title:             'Annuler l\'action',
      message:           'Cette action sera marquée comme annulée. Continuer ?',
      confirmButtonText: 'Annuler l\'action',
      type:              'warning'
    }).then(() => {
      this.api.cancel(a.publicId).subscribe({
        next:  () => { this.load(); this.feedback.showSuccess('Action annulée.'); },
        error: () => this.feedback.showError('Annulation impossible.')
      });
    }).catch(() => {});
  }
}
