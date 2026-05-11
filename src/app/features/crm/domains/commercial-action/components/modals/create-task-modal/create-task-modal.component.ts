import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalLayoutComponent } from '../../../../../shared/components/modal-layout/modal-layout.component';
import { CrmCommercialActionApiService } from '../../../services/crm-commercial-action-api.service';
import { CrmUserApiService } from '../../../../../shared/services/crm-user-api.service';
import { FeedbackService } from '../../../../../../../shared/feedback/tools/feedback.service';
import { AuthFacade } from '../../../../../../../core/auth/services/auth.facade';
import {
  CommercialActionType,
  CommercialActionPriority,
  CreateCommercialActionRequest,
  COMMERCIAL_ACTION_PRIORITY_LABELS
} from '../../../models/commercial-action.model';
import { CommercialSummary, commercialDisplayName } from '../../../../../shared/models/commercial.model';

/**
 * Modal for creating a to-do task as a commercial action.
 *
 * Creates a {@link CreateCommercialActionRequest} of type TASK.
 * Includes priority, optional due date, reminder and description.
 * The accent color is violet (#7c3aed) to visually distinguish tasks
 * from calls (blue) and meetings (green).
 */
@Component({
  selector: 'app-create-task-modal',
  imports: [FormsModule, ModalLayoutComponent],
  templateUrl: './create-task-modal.component.html',
  styleUrl: './create-task-modal.component.scss'
})
export class CreateTaskModalComponent implements OnInit {

  /** Public ID of the contact to link this task to. */
  @Input() contactPublicId?: string;
  /** Public ID of the lead to link this task to. */
  @Input() leadPublicId?: string;
  /** Public ID of the deal to link this task to. */
  @Input() dealPublicId?: string;

  /** Emitted after the task has been successfully created. */
  @Output() created   = new EventEmitter<void>();
  /** Emitted when the user dismisses the modal without saving. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api        = inject(CrmCommercialActionApiService);
  private readonly userApi    = inject(CrmUserApiService);
  private readonly feedback   = inject(FeedbackService);
  private readonly authFacade = inject(AuthFacade);

  /** True while the HTTP request is in flight. */
  readonly saving = signal(false);

  readonly accentColor = '#7c3aed';

  // ─── Assignee ─────────────────────────────────────────────────────────────
  commercials        = signal<CommercialSummary[]>([]);
  assignedToPublicId = '';
  readonly displayName = commercialDisplayName;

  // ─── Form fields ─────────────────────────────────────────────────────────
  title:       string = '';
  description: string = '';
  dueDate:     string = '';
  reminderAt:  string = '';
  priority: CommercialActionPriority = CommercialActionPriority.MEDIUM;

  readonly priorities = Object.values(CommercialActionPriority);

  /** Returns the human-readable label for a {@link CommercialActionPriority}. */
  priorityLabel(p: CommercialActionPriority): string { return COMMERCIAL_ACTION_PRIORITY_LABELS[p]; }

  /**
   * Loads the list of available assignees.
   * Admins see all commercials; non-admins only see themselves.
   */
  ngOnInit(): void {
    if (this.authFacade.isAdmin()) {
      this.userApi.getCommercials().subscribe({
        next: list => {
          this.commercials.set(list);
          const me = this.authFacade.user();
          if (me) this.assignedToPublicId = me.publicId;
        },
        error: () => this.feedback.showError('Impossible de charger la liste des commerciaux.')
      });
    } else {
      const me = this.authFacade.user();
      if (me) {
        this.commercials.set([{ publicId: me.publicId, firstName: me.firstname, lastName: me.lastname, username: me.username }]);
        this.assignedToPublicId = me.publicId;
      }
    }
  }

  /**
   * Validates required fields, builds the {@link CreateCommercialActionRequest}
   * and posts it to the API. Emits {@link created} on success.
   */
  submit(): void {
    if (!this.title.trim() || !this.assignedToPublicId) return;

    const body: CreateCommercialActionRequest = {
      type:               CommercialActionType.TASK,
      title:              this.title.trim(),
      assignedToPublicId: this.assignedToPublicId,
      priority:           this.priority,
      ...(this.description.trim() && { description: this.description.trim() }),
      ...(this.dueDate            && { dueDate:     new Date(this.dueDate).toISOString() }),
      ...(this.reminderAt         && { reminderAt:  new Date(this.reminderAt).toISOString() }),
      ...(this.contactPublicId    && { contactPublicId: this.contactPublicId }),
      ...(this.leadPublicId       && { leadPublicId:    this.leadPublicId }),
      ...(this.dealPublicId       && { dealPublicId:    this.dealPublicId }),
    };

    this.saving.set(true);
    this.api.create(body).subscribe({
      next:  () => { this.saving.set(false); this.feedback.showSuccess('Tâche créée.'); this.created.emit(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la création.'); }
    });
  }
}
