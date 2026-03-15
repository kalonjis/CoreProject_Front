import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-contact-action-assign',
  imports: [FormsModule],
  templateUrl: './contact-action-assign.component.html',
  styleUrl: './contact-action-assign.component.scss'
})
export class ContactActionAssignComponent {
  @Input({ required: true }) publicId!: string;
  @Input() currentAssigneePublicId: string | null = null;
  @Output() assigned  = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmContactApiService);
  private readonly feedback = inject(FeedbackService);

  commercialPublicId = '';
  readonly loading = signal(false);

  submit(): void {
    this.loading.set(true);
    const value = this.commercialPublicId.trim() || null;
    this.api.assign(this.publicId, { commercialPublicId: value }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess(value ? 'Contact assigné.' : 'Assignation retirée.');
        this.assigned.emit();
      },
      error: () => { this.loading.set(false); this.feedback.showError("Impossible d'assigner le contact."); }
    });
  }
}
