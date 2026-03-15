import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CommercialActionPriority,
  COMMERCIAL_ACTION_PRIORITY_LABELS,
  CreateCommercialActionRequest
} from '../../models/commercial-action.model';
import { CrmCommercialActionApiService } from '../../services/crm-commercial-action-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-commercial-action-form',
  imports: [FormsModule],
  templateUrl: './commercial-action-form.component.html',
  styleUrl: './commercial-action-form.component.scss'
})
export class CommercialActionFormComponent {
  @Input() dealPublicId?: string;
  @Input() contactPublicId?: string;
  /** publicId de l'utilisateur connecté, utilisé comme valeur par défaut pour assignedTo */
  @Input() currentUserPublicId = '';
  @Output() created   = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmCommercialActionApiService);
  private readonly feedback = inject(FeedbackService);

  readonly saving = signal(false);

  // ─── Form fields ──────────────────────────────────────────────────────────
  title        = '';
  description  = '';
  priority: CommercialActionPriority = CommercialActionPriority.MEDIUM;
  dueDate      = '';   // date input (yyyy-MM-dd)
  assignedToPublicId = '';

  readonly priorities = Object.values(CommercialActionPriority);
  priorityLabel(p: CommercialActionPriority) { return COMMERCIAL_ACTION_PRIORITY_LABELS[p]; }

  // ─── Submit ───────────────────────────────────────────────────────────────
  submit(): void {
    if (!this.title.trim()) return;

    const assignee = this.assignedToPublicId.trim() || this.currentUserPublicId;
    if (!assignee) {
      this.feedback.showError('Veuillez renseigner un responsable.');
      return;
    }

    const body: CreateCommercialActionRequest = {
      title:              this.title.trim(),
      assignedToPublicId: assignee,
      priority:           this.priority,
      ...(this.description.trim() && { description: this.description.trim() }),
      ...(this.dueDate             && { dueDate: new Date(this.dueDate).toISOString() }),
      ...(this.dealPublicId        && { dealPublicId: this.dealPublicId }),
      ...(this.contactPublicId     && { contactPublicId: this.contactPublicId }),
    };

    this.saving.set(true);
    this.api.create(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.feedback.showSuccess('Action créée.');
        this.created.emit();
      },
      error: () => {
        this.saving.set(false);
        this.feedback.showError('Erreur lors de la création.');
      }
    });
  }
}
