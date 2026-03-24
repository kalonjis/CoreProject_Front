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
export class CommercialActionDetailComponent implements OnInit {

  private readonly route    = inject(ActivatedRoute);
  private readonly api      = inject(CrmCommercialActionApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly confirm  = inject(ConfirmDialogService);

  readonly action           = signal<CommercialActionResponse | null>(null);
  readonly loading          = signal(false);
  readonly showEditModal    = signal(false);
  readonly showCompleteModal = signal(false);

  readonly CommercialActionStatus = CommercialActionStatus;
  readonly requiresCalendarSlot   = requiresCalendarSlot;
  readonly TYPE_LABELS            = COMMERCIAL_ACTION_TYPE_LABELS;

  private publicId = '';

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getByPublicId(this.publicId).subscribe({
      next:  a  => { this.action.set(a); this.loading.set(false); },
      error: () => { this.loading.set(false); this.feedback.showError('Action introuvable.'); }
    });
  }

  onEdited(): void {
    this.showEditModal.set(false);
    this.load();
  }

  onConfirmed(details: CompleteCommercialActionRequest | undefined): void {
    this.showCompleteModal.set(false);
    const a = this.action();
    if (!a) return;
    this.api.complete(a.publicId, details).subscribe({
      next:  () => { this.load(); this.feedback.showSuccess('Action terminée.'); },
      error: () => this.feedback.showError('Impossible de terminer l\'action.')
    });
  }

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
