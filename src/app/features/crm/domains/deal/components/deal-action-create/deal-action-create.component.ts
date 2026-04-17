import { Component, Input, Output, EventEmitter, OnInit, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmDealApiService } from '../../services/crm-deal-api.service';
import { CrmPipelineApiService } from '../../../pipeline/services/crm-pipeline-api.service';
import { CrmUserApiService } from '../../../../shared/services/crm-user-api.service';
import { CrmContactApiService } from '../../../contact/services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { CreateDealRequest, DealDetail } from '../../models/deal.model';
import { Pipeline, PipelineStep } from '../../../pipeline/models/pipeline.model';
import { CommercialSummary, commercialDisplayName } from '../../../../shared/models/commercial.model';
import { ContactSummary } from '../../../contact/models/contact.model';

@Component({
  selector: 'app-deal-action-create',
  imports: [FormsModule],
  templateUrl: './deal-action-create.component.html',
  styleUrl: './deal-action-create.component.scss'
})
/** Inline form for creating a new deal, with pipeline/stage selection and optional contact picker. */
export class DealActionCreateComponent implements OnInit {
  /** Pre-filled contact (from contact-detail page). When absent, a picker is shown. */
  @Input() contactPublicId = '';
  @Input() organisationPublicId: string | null = null;
  @Input() assignedToPublicId = '';
  @Input() defaultTitle = '';
  @Output() created   = new EventEmitter<DealDetail>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly dealApi     = inject(CrmDealApiService);
  private readonly pipelineApi = inject(CrmPipelineApiService);
  private readonly userApi     = inject(CrmUserApiService);
  private readonly contactApi  = inject(CrmContactApiService);
  private readonly feedback    = inject(FeedbackService);

  readonly loading          = signal(false);
  readonly pipelines        = signal<Pipeline[]>([]);
  readonly commercials      = signal<CommercialSummary[]>([]);
  readonly orgContacts      = signal<ContactSummary[]>([]);
  readonly pipelinesLoading = signal(true);
  readonly selectedPipelineId = signal('');

  readonly availableStages = computed<PipelineStep[]>(() => {
    const pipeline = this.pipelines().find(p => p.publicId === this.selectedPipelineId());
    return pipeline?.steps
      .filter(s => !s.isWon && !s.isLost)
      .sort((a, b) => a.position - b.position) ?? [];
  });

  /** True when no contactPublicId was provided — the user must pick one. */
  get showContactPicker(): boolean { return !this.contactPublicId; }

  dealTitle            = '';
  dealStagePublicId    = '';
  dealAssigneePublicId = '';
  selectedContactPublicId = '';
  dealAmount: number | undefined = undefined;
  dealCurrency         = 'EUR';
  dealExpectedClose    = '';

  readonly commercialDisplayName = commercialDisplayName;

  ngOnInit(): void {
    this.dealTitle             = this.defaultTitle;
    this.dealAssigneePublicId  = this.assignedToPublicId;
    this.loadDependencies();
    if (this.showContactPicker && this.organisationPublicId) {
      this.contactApi.findByOrganisation(this.organisationPublicId).subscribe({
        next: list => this.orgContacts.set(list)
      });
    }
  }

  get isValid(): boolean {
    const hasContact = this.contactPublicId || this.selectedContactPublicId;
    return this.dealTitle.trim().length > 0
      && this.selectedPipelineId().length > 0
      && this.dealStagePublicId.length > 0
      && this.dealAssigneePublicId.length > 0
      && !!hasContact;
  }

  private loadDependencies(): void {
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

  submit(): void {
    if (!this.isValid) return;

    const body: CreateDealRequest = {
      title:              this.dealTitle.trim(),
      pipelinePublicId:   this.selectedPipelineId(),
      stagePublicId:      this.dealStagePublicId,
      contactPublicId:    this.contactPublicId || this.selectedContactPublicId,
      assignedToPublicId: this.dealAssigneePublicId,
      currency:           this.dealCurrency || 'EUR'
    };
    if (this.dealAmount != null)         body.amount               = this.dealAmount;
    if (this.organisationPublicId)       body.organisationPublicId = this.organisationPublicId;
    if (this.dealExpectedClose)          body.expectedCloseDate    = this.dealExpectedClose;

    this.loading.set(true);
    this.dealApi.create(body).subscribe({
      next: deal => {
        this.loading.set(false);
        this.feedback.showSuccess('Deal créé avec succès.');
        this.created.emit(deal);
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError('Impossible de créer le deal.');
      }
    });
  }
}
