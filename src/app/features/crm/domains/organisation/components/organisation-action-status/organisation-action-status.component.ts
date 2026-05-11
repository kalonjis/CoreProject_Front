import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { OrganisationStatus, ORGANISATION_STATUS_LABELS } from '../../models/organisation.model';

@Component({
  standalone: true,
  selector: 'app-organisation-action-status',
  imports: [FormsModule],
  templateUrl: './organisation-action-status.component.html',
  styleUrl: './organisation-action-status.component.scss'
})
/** Inline form for transitioning an organisation's lifecycle status. */
export class OrganisationActionStatusComponent {
  /** Public ID of the organisation whose status is being changed. */
  @Input({ required: true }) publicId!: string;
  /** Current status, excluded from the list of available targets. */
  @Input({ required: true }) currentStatus!: OrganisationStatus;
  /** Emitted after a successful status transition. */
  @Output() statusChanged = new EventEmitter<void>();
  /** Emitted when the user dismisses the form without saving. */
  @Output() cancelled     = new EventEmitter<void>();

  private readonly api      = inject(CrmOrganisationApiService);
  private readonly feedback = inject(FeedbackService);

  selectedStatus: OrganisationStatus | '' = '';
  /** True while the status-change request is in flight. */
  readonly loading = signal(false);

  /** Returns all statuses that differ from the current one. */
  get availableStatuses(): OrganisationStatus[] {
    return Object.values(OrganisationStatus).filter(s => s !== this.currentStatus);
  }

  readonly statusLabels = ORGANISATION_STATUS_LABELS;

  /** Submits the selected status transition to the API. */
  submit(): void {
    if (!this.selectedStatus) return;
    this.loading.set(true);
    this.api.updateStatus(this.publicId, { status: this.selectedStatus }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Statut mis à jour.');
        this.statusChanged.emit();
      },
      error: () => { this.loading.set(false); this.feedback.showError('Impossible de changer le statut.'); }
    });
  }
}
