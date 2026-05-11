/**
 * Inline action panel for rejecting a lead.
 *
 * Requires a rejection reason and shows a confirmation dialog before calling the API.
 * Emits {@link rejected} on success and {@link cancelled} on dismissal.
 */
import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';

@Component({
  selector: 'app-lead-action-reject',
  imports: [FormsModule],
  templateUrl: './lead-action-reject.component.html',
  styleUrl: './lead-action-reject.component.scss'
})
export class LeadActionRejectComponent {
  /** Public ID of the lead to reject. */
  @Input({ required: true }) publicId!: string;
  /** Emitted after the lead has been successfully rejected. */
  @Output() rejected  = new EventEmitter<void>();
  /** Emitted when the user dismisses the panel without submitting. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api     = inject(CrmLeadApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly confirm  = inject(ConfirmDialogService);

  rejectionReason = '';
  /** True while the rejection request is in flight. */
  readonly loading = signal(false);

  /** Prompts for confirmation then rejects the lead with the provided reason. */
  async submit(): Promise<void> {
    if (!this.rejectionReason.trim()) return;

    try {
      await this.confirm.confirm({
        title: 'Rejeter le lead',
        message: 'Cette action est irréversible. Confirmer le rejet ?',
        confirmButtonText: 'Rejeter',
        type: 'danger'
      });
    } catch {
      return; // annulé
    }

    this.loading.set(true);
    this.api.reject(this.publicId, { rejectionReason: this.rejectionReason }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Lead rejeté.');
        this.rejected.emit();
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError('Impossible de rejeter le lead.');
      }
    });
  }
}
