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
  @Output() created   = new EventEmitter<LeadDetail>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmLeadApiService);
  private readonly feedback = inject(FeedbackService);

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

  get isValid(): boolean {
    return this.email.trim().length > 0
      && this.subject.trim().length >= 2
      && !!this.leadType;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

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
