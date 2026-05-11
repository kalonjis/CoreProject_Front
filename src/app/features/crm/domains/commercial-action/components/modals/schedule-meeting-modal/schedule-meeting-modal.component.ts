import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
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
import { ScheduleContextService } from '../../../../../shared/services/schedule-context.service';

/**
 * Modal for scheduling a future meeting or demo as a commercial action.
 *
 * Creates a {@link CreateCommercialActionRequest} of type MEETING.
 * Includes location/video link, duration, due date, priority and reminder.
 * The accent color is emerald green (#16a34a), consistent with the calendar agenda theme.
 */
@Component({
  selector: 'app-schedule-meeting-modal',
  imports: [FormsModule, ModalLayoutComponent],
  templateUrl: './schedule-meeting-modal.component.html',
  styleUrl: './schedule-meeting-modal.component.scss'
})
export class ScheduleMeetingModalComponent implements OnInit, OnDestroy {

  /** Public ID of the contact to link this action to. */
  @Input() contactPublicId?: string;
  /** Public ID of the lead to link this action to. */
  @Input() leadPublicId?: string;
  /** Public ID of the deal to link this action to. */
  @Input() dealPublicId?: string;

  /** Emitted after the action has been successfully created. */
  @Output() created   = new EventEmitter<void>();
  /** Emitted when the user dismisses the modal without saving. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api          = inject(CrmCommercialActionApiService);
  private readonly userApi      = inject(CrmUserApiService);
  private readonly feedback     = inject(FeedbackService);
  private readonly authFacade   = inject(AuthFacade);
  private readonly scheduleCtx  = inject(ScheduleContextService);

  /** True while the HTTP request is in flight. */
  readonly saving = signal(false);

  readonly accentColor = '#16a34a';

  /** True when a date is selected — drives [rightPanelOpen] on the modal layout. */
  readonly agendaPanelOpen = computed(() => this.scheduleCtx.activeDate() !== null);

  // ─── Assignee ─────────────────────────────────────────────────────────────
  commercials        = signal<CommercialSummary[]>([]);
  assignedToPublicId = '';
  readonly displayName = commercialDisplayName;

  // ─── Form fields ─────────────────────────────────────────────────────────
  title:           string = '';
  description:     string = '';
  dueDate:         string = '';
  reminderAt:      string = '';
  location:        string = '';
  durationMinutes: number | null = 60;
  priority: CommercialActionPriority = CommercialActionPriority.MEDIUM;

  readonly priorities = Object.values(CommercialActionPriority);

  /** Returns the human-readable label for a {@link CommercialActionPriority}. */
  priorityLabel(p: CommercialActionPriority): string { return COMMERCIAL_ACTION_PRIORITY_LABELS[p]; }

  /**
   * Loads the list of available assignees and opens the agenda context.
   * Admins see all commercials; non-admins only see themselves.
   */
  ngOnInit(): void {
    this.scheduleCtx.isOpen.set(true);

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

  /** Resets the agenda context when the modal is closed. */
  ngOnDestroy(): void {
    this.scheduleCtx.isOpen.set(false);
    this.scheduleCtx.activeDate.set(null);
  }

  /** Called by (ngModelChange) on the date field — updates the agenda panel. */
  onDueDateChange(value: string): void {
    this.dueDate = value;
    this.scheduleCtx.activeDate.set(value ? value.slice(0, 10) : null);
  }

  /**
   * Validates required fields, builds the {@link CreateCommercialActionRequest}
   * and posts it to the API. Emits {@link created} on success.
   */
  submit(): void {
    if (!this.title.trim() || !this.assignedToPublicId) return;

    const body: CreateCommercialActionRequest = {
      type:               CommercialActionType.MEETING,
      title:              this.title.trim(),
      assignedToPublicId: this.assignedToPublicId,
      priority:           this.priority,
      ...(this.description.trim()    && { description:     this.description.trim() }),
      ...(this.dueDate               && { dueDate:         new Date(this.dueDate).toISOString() }),
      ...(this.reminderAt            && { reminderAt:      new Date(this.reminderAt).toISOString() }),
      ...(this.location.trim()       && { location:        this.location.trim() }),
      ...(this.durationMinutes       && { durationMinutes: this.durationMinutes }),
      ...(this.contactPublicId       && { contactPublicId: this.contactPublicId }),
      ...(this.leadPublicId          && { leadPublicId:    this.leadPublicId }),
      ...(this.dealPublicId          && { dealPublicId:    this.dealPublicId }),
    };

    this.saving.set(true);
    this.api.create(body).subscribe({
      next:  () => { this.saving.set(false); this.feedback.showSuccess('Réunion planifiée.'); this.created.emit(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la création.'); }
    });
  }
}
