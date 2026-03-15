import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmDealApiService } from '../../services/crm-deal-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-deal-action-reassign',
  imports: [FormsModule],
  templateUrl: './deal-action-reassign.component.html',
  styleUrl: './deal-action-reassign.component.scss'
})
export class DealActionReassignComponent {
  @Input({ required: true }) publicId!: string;
  @Output() reassigned = new EventEmitter<void>();
  @Output() cancelled  = new EventEmitter<void>();

  private readonly api      = inject(CrmDealApiService);
  private readonly feedback = inject(FeedbackService);

  readonly loading = signal(false);

  assignedToPublicId = '';

  submit(): void {
    this.loading.set(true);
    const value = this.assignedToPublicId.trim() || null;
    this.api.reassign(this.publicId, { assignedToPublicId: value }).subscribe({
      next: () => {
        this.feedback.showSuccess(value ? 'Deal réassigné.' : 'Assignation retirée.');
        this.reassigned.emit();
        this.loading.set(false);
      },
      error: () => {
        this.feedback.showError('Impossible de réassigner le deal.');
        this.loading.set(false);
      }
    });
  }
}
