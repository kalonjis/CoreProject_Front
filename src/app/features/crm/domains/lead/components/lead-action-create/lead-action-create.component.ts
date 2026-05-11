/**
 * Inline form for creating a new CRM lead manually.
 *
 * Emits the created {@link LeadDetail} via {@link created} on success,
 * or {@link cancelled} when the user dismisses the form.
 */
import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import {
  Civility, CIVILITY_LABELS,
  CreateLeadRequest,
  LeadDetail,
  LeadType, LEAD_TYPE_LABELS
} from '../../models/lead.model';

@Component({
  selector: 'app-lead-action-create',
  imports: [FormsModule],
  templateUrl: './lead-action-create.component.html',
  styleUrl: './lead-action-create.component.scss'
})
export class LeadActionCreateComponent {
  /** Emitted with the newly created {@link LeadDetail} after a successful API call. */
  @Output() created   = new EventEmitter<LeadDetail>();
  /** Emitted when the user dismisses the form without submitting. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmLeadApiService);
  private readonly feedback = inject(FeedbackService);

  /** True while the creation request is in flight. */
  readonly loading = signal(false);

  // ── Form fields ────────────────────────────────────────────────────────────

  email            = '';
  civility: Civility | null = null;
  firstName        = '';
  lastName         = '';
  phone            = '';
  organisationName = '';
  subject          = '';
  message          = '';
  leadType: LeadType = LeadType.COMMERCIAL;

  // ── Lookup tables ──────────────────────────────────────────────────────────

  readonly civilities     = Object.values(Civility);
  readonly civilityLabels = CIVILITY_LABELS;
  readonly leadTypes      = Object.values(LeadType);
  readonly leadTypeLabels = LEAD_TYPE_LABELS;

  // ── Validation ─────────────────────────────────────────────────────────────

  /** True when the minimum required fields (email, subject, leadType) are filled. */
  get isValid(): boolean {
    return this.email.trim().length > 0
      && this.subject.trim().length >= 2
      && !!this.leadType;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  /** Validates the form, posts the new lead, and emits {@link created} on success. */
  submit(): void {
    if (!this.isValid) return;

    const body: CreateLeadRequest = {
      email:    this.email.trim(),
      subject:  this.subject.trim(),
      leadType: this.leadType
    };
    if (this.civility)             body.civility         = this.civility;
    if (this.firstName.trim())     body.firstName        = this.firstName.trim();
    if (this.lastName.trim())      body.lastName         = this.lastName.trim();
    if (this.phone.trim())         body.phone            = this.phone.trim();
    if (this.organisationName.trim()) body.organisationName = this.organisationName.trim();
    if (this.message.trim())       body.message          = this.message.trim();

    this.loading.set(true);
    this.api.create(body).subscribe({
      next: lead => {
        this.loading.set(false);
        this.feedback.showSuccess('Lead créé avec succès.');
        this.created.emit(lead);
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError('Impossible de créer le lead.');
      }
    });
  }
}
