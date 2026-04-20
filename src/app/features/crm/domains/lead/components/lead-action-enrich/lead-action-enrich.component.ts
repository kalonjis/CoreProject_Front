/**
 * Inline action panel for enriching a lead with additional contact and qualification data.
 *
 * Pre-fills form fields from the current lead data.
 * Emits {@link enriched} after a successful API call and {@link cancelled} on dismissal.
 */
import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { Civility, CIVILITY_LABELS, LeadDetail, LeadSource, LEAD_SOURCE_LABELS, LeadType, LEAD_TYPE_LABELS } from '../../models/lead.model';

@Component({
  selector: 'app-lead-action-enrich',
  imports: [FormsModule],
  templateUrl: './lead-action-enrich.component.html',
  styleUrl: './lead-action-enrich.component.scss'
})
export class LeadActionEnrichComponent implements OnInit {
  @Input({ required: true }) publicId!: string;
  @Input() lead: LeadDetail | null = null;
  @Output() enriched  = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmLeadApiService);
  private readonly feedback = inject(FeedbackService);

  civility: Civility | null = null;
  firstName        = '';
  lastName         = '';
  phone            = '';
  jobTitle         = '';
  organisationName = '';
  leadType: LeadType | null = null;
  leadSource: LeadSource | null = null;

  readonly civilities      = Object.values(Civility);
  readonly civilityLabels  = CIVILITY_LABELS;
  readonly leadTypes       = Object.values(LeadType);
  readonly leadTypeLabels  = LEAD_TYPE_LABELS;
  readonly leadSources     = Object.values(LeadSource);
  readonly leadSourceLabels = LEAD_SOURCE_LABELS;
  readonly loading         = signal(false);

  ngOnInit(): void {
    if (this.lead) {
      this.civility         = this.lead.civility         ?? null;
      this.firstName        = this.lead.firstName        ?? '';
      this.lastName         = this.lead.lastName         ?? '';
      this.phone            = this.lead.phone            ?? '';
      this.jobTitle         = this.lead.jobTitle         ?? '';
      this.organisationName = this.lead.organisationName ?? '';
      this.leadType         = this.lead.leadType         ?? null;
      this.leadSource       = this.lead.leadSource       ?? null;
    }
  }

  submit(): void {
    this.loading.set(true);
    this.api.enrich(this.publicId, {
      civility:         this.civility         || null,
      firstName:        this.firstName        || null,
      lastName:         this.lastName         || null,
      phone:            this.phone            || null,
      jobTitle:         this.jobTitle         || null,
      organisationName: this.organisationName || null,
      leadType:         this.leadType         || null,
      leadSource:       this.leadSource       || null
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Lead enrichi avec succès.');
        this.enriched.emit();
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError("Impossible d'enrichir le lead.");
      }
    });
  }
}
