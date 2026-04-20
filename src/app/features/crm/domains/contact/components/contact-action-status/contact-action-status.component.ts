import { Component, Input, Output, EventEmitter, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ContactStatus, CONTACT_STATUS_LABELS, CONTACT_STATUS_TRANSITIONS } from '../../models/contact.model';

@Component({
  selector: 'app-contact-action-status',
  imports: [FormsModule],
  templateUrl: './contact-action-status.component.html',
  styleUrl: './contact-action-status.component.scss'
})
/** Inline form for transitioning a contact's lifecycle status to one of its allowed next states. */
export class ContactActionStatusComponent {
  @Input({ required: true }) publicId!: string;
  @Input({ required: true }) currentStatus!: ContactStatus;
  @Output() statusChanged = new EventEmitter<void>();
  @Output() cancelled     = new EventEmitter<void>();

  private readonly api      = inject(CrmContactApiService);
  private readonly feedback = inject(FeedbackService);

  selectedStatus: ContactStatus | '' = '';
  readonly loading = signal(false);

  get availableTransitions(): ContactStatus[] {
    return CONTACT_STATUS_TRANSITIONS[this.currentStatus] ?? [];
  }

  readonly statusLabels = CONTACT_STATUS_LABELS;

  submit(): void {
    if (!this.selectedStatus) return;
    this.loading.set(true);
    this.api.updateStatus(this.publicId, { status: this.selectedStatus }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Statut mis à jour.');
        this.statusChanged.emit();
      },
      error: () => { this.loading.set(false); this.feedback.showError('Transition de statut invalide.'); }
    });
  }
}
