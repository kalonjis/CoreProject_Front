import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AddressSuggestionApiService, AddressSuggestion } from '../../../../../../shared/address/services/address-suggestion-api.service';
import {
  CommercialActionType,
  CommercialActionPriority,
  CommercialActionResponse,
  COMMERCIAL_ACTION_TYPE_LABELS,
  COMMERCIAL_ACTION_PRIORITY_LABELS,
  requiresCalendarSlot,
  CreateCommercialActionRequest,
  UpdateCommercialActionRequest
} from '../../models/commercial-action.model';
import { CrmCommercialActionApiService } from '../../services/crm-commercial-action-api.service';
import { CrmUserApiService } from '../../../../shared/services/crm-user-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { AuthFacade } from '../../../../../../core/auth/services/auth.facade';
import { CommercialSummary, commercialDisplayName } from '../../../../shared/models/commercial.model';

@Component({
  selector: 'app-commercial-action-form',
  imports: [FormsModule],
  templateUrl: './commercial-action-form.component.html',
  styleUrl: './commercial-action-form.component.scss'
})
/**
 * Form component for creating or editing a commercial action.
 * Supports address autocomplete, assignee selection, and calendar fields for MEETING/DEMO types.
 */
export class CommercialActionFormComponent implements OnInit, OnDestroy {
  /** Public ID of the deal to link the new action to. */
  @Input() dealPublicId?: string;
  /** Public ID of the contact to link the new action to. */
  @Input() contactPublicId?: string;
  /** Public ID of the lead to link the new action to. */
  @Input() leadPublicId?: string;
  /** Existing action to edit; when set, the form operates in edit mode. */
  @Input() existingAction?: CommercialActionResponse;
  /** Pre-selects a specific action type when creating a new action. */
  @Input() initialType?: CommercialActionType;
  /** Emitted after a new action has been successfully created. */
  @Output() created   = new EventEmitter<void>();
  /** Emitted after an existing action has been successfully updated. */
  @Output() updated   = new EventEmitter<void>();
  /** Emitted when the user dismisses the form without saving. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api           = inject(CrmCommercialActionApiService);
  private readonly userApi       = inject(CrmUserApiService);
  private readonly feedback      = inject(FeedbackService);
  private readonly authFacade    = inject(AuthFacade);
  private readonly addressApi    = inject(AddressSuggestionApiService);

  /** True while the create or update request is in flight. */
  readonly saving = signal(false);

  /** True when the form is operating on an existing action. */
  get isEditMode(): boolean { return !!this.existingAction; }

  // ─── Address picker ───────────────────────────────────────────────────────
  addressQuery              = '';
  addressSuggestions:        AddressSuggestion[] = [];
  selectedAddressPublicId:   string | null = null;
  selectedAddressText:       string | null = null;

  private readonly addressSearch$ = new Subject<string>();
  private addressSub!:             Subscription;

  // ─── Assignee dropdown ────────────────────────────────────────────────────
  commercials      = signal<CommercialSummary[]>([]);
  assignedToPublicId = '';
  readonly displayName = commercialDisplayName;

  ngOnInit(): void {
    this.addressSub = this.addressSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length >= 2 ? this.addressApi.search(q) : of([]))
    ).subscribe(results => this.addressSuggestions = results);

    if (this.existingAction) {
      this.populateFromExisting(this.existingAction);
    } else if (this.initialType) {
      this.type = this.initialType;
    }

    if (this.authFacade.isAdmin()) {
      this.userApi.getCommercials().subscribe({
        next: list => {
          this.commercials.set(list);
          if (!this.existingAction) {
            const me = this.authFacade.user();
            if (me) this.assignedToPublicId = me.publicId;
          }
        },
        error: () => this.feedback.showError('Impossible de charger la liste des commerciaux.')
      });
    } else {
      const me = this.authFacade.user();
      if (me) {
        this.commercials.set([{ publicId: me.publicId, firstName: me.firstname, lastName: me.lastname, username: me.username }]);
        if (!this.existingAction) this.assignedToPublicId = me.publicId;
      }
    }
  }

  private populateFromExisting(action: CommercialActionResponse): void {
    this.title              = action.title;
    this.description        = action.description ?? '';
    this.type               = action.type;
    this.priority           = action.priority;
    this.dueDate            = this.toLocalDatetime(action.dueDate);
    this.reminderAt         = this.toLocalDatetime(action.reminderAt);
    this.location           = action.location ?? '';
    this.durationMinutes    = action.durationMinutes ?? 60;
    this.assignedToPublicId = action.assignedToPublicId;
  }

  private toLocalDatetime(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ─── Form fields ──────────────────────────────────────────────────────────
  title        = '';
  description  = '';
  type: CommercialActionType         = CommercialActionType.TASK;
  priority: CommercialActionPriority = CommercialActionPriority.MEDIUM;
  dueDate      = '';
  reminderAt   = '';
  location     = '';
  durationMinutes = 60;

  readonly types      = Object.values(CommercialActionType);
  readonly priorities = Object.values(CommercialActionPriority);

  typeLabel(t: CommercialActionType)         { return COMMERCIAL_ACTION_TYPE_LABELS[t]; }
  priorityLabel(p: CommercialActionPriority) { return COMMERCIAL_ACTION_PRIORITY_LABELS[p]; }

  /** True when the selected type requires calendar slot fields (location, duration). */
  get showCalendarFields(): boolean { return requiresCalendarSlot(this.type); }

  /** Triggers a debounced address search when the user types in the address field. */
  onAddressInput(): void { this.addressSearch$.next(this.addressQuery); }

  onAddressBlur(): void {
    setTimeout(() => this.addressSuggestions = [], 150);
  }

  selectAddress(suggestion: AddressSuggestion): void {
    this.selectedAddressPublicId = suggestion.publicId;
    this.selectedAddressText     = suggestion.displayText;
    this.addressQuery            = '';
    this.addressSuggestions      = [];
  }

  clearAddress(): void {
    this.selectedAddressPublicId = null;
    this.selectedAddressText     = null;
  }

  ngOnDestroy(): void { this.addressSub?.unsubscribe(); }

  // ─── Submit ───────────────────────────────────────────────────────────────
  submit(): void {
    if (!this.title.trim()) return;
    if (!this.assignedToPublicId) {
      this.feedback.showError('Veuillez sélectionner un responsable.');
      return;
    }

    this.saving.set(true);

    if (this.isEditMode) {
      this.submitUpdate();
    } else {
      this.submitCreate();
    }
  }

  private submitCreate(): void {
    const body: CreateCommercialActionRequest = {
      title:              this.title.trim(),
      assignedToPublicId: this.assignedToPublicId,
      type:               this.type,
      priority:           this.priority,
      ...(this.description.trim()      && { description: this.description.trim() }),
      ...(this.dueDate                 && { dueDate: new Date(this.dueDate).toISOString() }),
      ...(this.reminderAt              && { reminderAt: new Date(this.reminderAt).toISOString() }),
      ...(this.dealPublicId            && { dealPublicId: this.dealPublicId }),
      ...(this.contactPublicId         && { contactPublicId: this.contactPublicId }),
      ...(this.leadPublicId            && { leadPublicId: this.leadPublicId }),
      ...(this.location.trim()         && { location: this.location.trim() }),
      ...(this.showCalendarFields      && { durationMinutes: this.durationMinutes }),
      ...(this.selectedAddressPublicId && { addressPublicId: this.selectedAddressPublicId }),
    };

    this.api.create(body).subscribe({
      next: () => { this.saving.set(false); this.feedback.showSuccess('Action créée.'); this.created.emit(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la création.'); }
    });
  }

  private submitUpdate(): void {
    const body: UpdateCommercialActionRequest = {
      title:              this.title.trim(),
      assignedToPublicId: this.assignedToPublicId,
      type:               this.type,
      priority:           this.priority,
      description:        this.description.trim() || undefined,
      dueDate:            this.dueDate    ? new Date(this.dueDate).toISOString()    : undefined,
      reminderAt:         this.reminderAt ? new Date(this.reminderAt).toISOString() : undefined,
      location:           this.location.trim() || undefined,
      ...(this.showCalendarFields      && { durationMinutes: this.durationMinutes }),
      ...(this.selectedAddressPublicId && { addressPublicId: this.selectedAddressPublicId }),
    };

    this.api.update(this.existingAction!.publicId, body).subscribe({
      next: () => { this.saving.set(false); this.feedback.showSuccess('Action mise à jour.'); this.updated.emit(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la mise à jour.'); }
    });
  }
}
