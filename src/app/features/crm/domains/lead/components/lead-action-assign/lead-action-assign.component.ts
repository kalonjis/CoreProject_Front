import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-lead-action-assign',
  imports: [FormsModule],
  templateUrl: './lead-action-assign.component.html',
  styleUrl: './lead-action-assign.component.scss'
})
export class LeadActionAssignComponent {
  @Input({ required: true }) publicId!: string;
  @Output() assigned  = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmLeadApiService);
  private readonly feedback = inject(FeedbackService);

  commercialPublicId = '';
  readonly loading   = signal(false);

  submit(): void {
    if (!this.commercialPublicId.trim()) return;
    this.loading.set(true);
    this.api.assign(this.publicId, { commercialPublicId: this.commercialPublicId }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Lead assigné avec succès.');
        this.assigned.emit();
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError("Impossible d'assigner le lead.");
      }
    });
  }
}
