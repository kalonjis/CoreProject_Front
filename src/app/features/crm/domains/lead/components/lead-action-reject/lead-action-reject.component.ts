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
  @Input({ required: true }) publicId!: string;
  @Output() rejected  = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api     = inject(CrmLeadApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly confirm  = inject(ConfirmDialogService);

  rejectionReason = '';
  readonly loading = signal(false);

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
