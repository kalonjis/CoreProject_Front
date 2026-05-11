/**
 * Two-step action panel for converting a lead into a contact (and optionally creating a deal).
 *
 * Step 1: fills in the contact creation form pre-populated from lead data and calls the convert API.
 * Step 2: optionally creates a deal linked to the newly created contact.
 * Emits {@link converted} when the flow completes and {@link cancelled} on dismissal.
 */
import { Component, Input, Output, EventEmitter, OnInit, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { CrmContactApiService } from '../../../contact/services/crm-contact-api.service';
import { CrmDealApiService } from '../../../deal/services/crm-deal-api.service';
import { CrmPipelineApiService } from '../../../pipeline/services/crm-pipeline-api.service';
import { CrmUserApiService } from '../../../../shared/services/crm-user-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ConvertLeadRequest, LeadDetail } from '../../models/lead.model';
import { ContactDetail } from '../../../contact/models/contact.model';
import { CreateDealRequest } from '../../../deal/models/deal.model';
import { Pipeline, PipelineStep } from '../../../pipeline/models/pipeline.model';
import { CommercialSummary, commercialDisplayName } from '../../../../shared/models/commercial.model';

type Step = 'convert' | 'deal';

@Component({
  selector: 'app-lead-action-convert',
  imports: [FormsModule],
  templateUrl: './lead-action-convert.component.html',
  styleUrl: './lead-action-convert.component.scss'
})
export class LeadActionConvertComponent implements OnInit {
  /** Public ID of the lead to convert. */
  @Input({ required: true }) publicId!: string;
  /** Current lead data used to pre-fill the conversion form. */
  @Input() lead: LeadDetail | null = null;
  /** Emitted when the conversion flow is fully complete (contact created, deal optionally created). */
  @Output() converted  = new EventEmitter<void>();
  /** Emitted when the user dismisses the flow without completing it. */
  @Output() cancelled  = new EventEmitter<void>();

  private readonly leadApi     = inject(CrmLeadApiService);
  private readonly contactApi  = inject(CrmContactApiService);
  private readonly dealApi     = inject(CrmDealApiService);
  private readonly pipelineApi = inject(CrmPipelineApiService);
  private readonly userApi     = inject(CrmUserApiService);
  private readonly feedback    = inject(FeedbackService);

  readonly step             = signal<Step>('convert');
  readonly loading          = signal(false);
  readonly convertedContact = signal<ContactDetail | null>(null);
  readonly pipelines        = signal<Pipeline[]>([]);
  readonly commercials      = signal<CommercialSummary[]>([]);
  readonly pipelinesLoading = signal(false);
  readonly selectedPipelineId = signal('');

  readonly availableStages = computed<PipelineStep[]>(() => {
    const pipeline = this.pipelines().find(p => p.publicId === this.selectedPipelineId());
    return pipeline?.steps
      .filter(s => !s.isWon && !s.isLost)
      .sort((a, b) => a.position - b.position) ?? [];
  });

  // ── Step 1: convert form ──────────────────────────────────────────────────

  form: ConvertLeadRequest & { email: string } = {
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    phone: '',
    organisationName: ''
  };

  // ── Step 2: deal form ─────────────────────────────────────────────────────

  dealTitle           = '';
  dealStagePublicId   = '';
  dealAssigneePublicId = '';
  dealAmount: number | undefined = undefined;
  dealCurrency        = 'EUR';
  dealExpectedClose   = '';

  readonly commercialDisplayName = commercialDisplayName;

  ngOnInit(): void {
    if (this.lead) {
      this.form.firstName        = this.lead.firstName        ?? '';
      this.form.lastName         = this.lead.lastName         ?? '';
      this.form.email            = this.lead.email            ?? '';
      this.form.phone            = this.lead.phone            ?? '';
      this.form.organisationName = this.lead.organisationName ?? '';
      this.dealTitle             = this.lead.subject          ?? '';
      this.dealAssigneePublicId  = this.lead.assignedToPublicId ?? '';
    }
  }

  get isConvertValid(): boolean {
    return this.form.firstName.trim().length > 0
      && this.form.lastName.trim().length > 0
      && this.form.email.trim().length > 0;
  }

  get isDealValid(): boolean {
    return this.dealTitle.trim().length > 0
      && this.selectedPipelineId().length > 0
      && this.dealStagePublicId.length > 0
      && this.dealAssigneePublicId.length > 0;
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────

  submit(): void {
    if (!this.isConvertValid) return;

    const body: ConvertLeadRequest = { firstName: this.form.firstName, lastName: this.form.lastName };
    if (this.form.email?.trim() && this.form.email.trim() !== this.lead?.email) body.email = this.form.email;
    if (this.form.jobTitle?.trim())         body.jobTitle         = this.form.jobTitle;
    if (this.form.phone?.trim())            body.phone            = this.form.phone;
    if (this.form.organisationName?.trim()) body.organisationName = this.form.organisationName;

    this.loading.set(true);
    this.leadApi.convert(this.publicId, body).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Lead converti en contact.');
        this.loadContactAndGoToDeal();
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError('Impossible de convertir le lead.');
      }
    });
  }

  private loadContactAndGoToDeal(): void {
    this.contactApi.getFromLead(this.publicId).subscribe({
      next: contact => {
        this.convertedContact.set(contact);
        if (contact.organisationPublicId) {
          // keep org context for deal
        }
        this.loadDealDependencies();
        this.step.set('deal');
      },
      error: () => {
        // Contact lookup failed — skip deal step
        this.converted.emit();
      }
    });
  }

  private loadDealDependencies(): void {
    this.pipelinesLoading.set(true);

    this.pipelineApi.findAll().subscribe({
      next: pipelines => {
        this.pipelines.set(pipelines);
        const defaultPipeline = pipelines.find(p => p.isDefault) ?? pipelines[0];
        if (defaultPipeline) {
          this.selectedPipelineId.set(defaultPipeline.publicId);
          const firstStep = defaultPipeline.steps
            .filter(s => !s.isWon && !s.isLost)
            .sort((a, b) => a.position - b.position)[0];
          if (firstStep) this.dealStagePublicId = firstStep.publicId;
        }
        this.pipelinesLoading.set(false);
      },
      error: () => this.pipelinesLoading.set(false)
    });

    this.userApi.getCommercials().subscribe({
      next: list => this.commercials.set(list)
    });
  }

  onPipelineChange(pipelinePublicId: string): void {
    this.selectedPipelineId.set(pipelinePublicId);
    const firstStep = this.availableStages()[0];
    this.dealStagePublicId = firstStep?.publicId ?? '';
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────

  createDeal(): void {
    if (!this.isDealValid) return;
    const contact = this.convertedContact();
    if (!contact) return;

    const body: CreateDealRequest = {
      title:              this.dealTitle.trim(),
      pipelinePublicId:   this.selectedPipelineId(),
      stagePublicId:      this.dealStagePublicId,
      contactPublicId:    contact.publicId,
      assignedToPublicId: this.dealAssigneePublicId,
      currency:           this.dealCurrency || 'EUR'
    };
    if (this.dealAmount != null)      body.amount           = this.dealAmount;
    if (contact.organisationPublicId) body.organisationPublicId = contact.organisationPublicId;
    if (this.dealExpectedClose)       body.expectedCloseDate = this.dealExpectedClose;

    this.loading.set(true);
    this.dealApi.create(body).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Deal créé avec succès.');
        this.converted.emit();
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError('Impossible de créer le deal.');
      }
    });
  }

  skipDeal(): void {
    this.converted.emit();
  }
}
