import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CrmDealApiService } from '../../services/crm-deal-api.service';
import { CrmPipelineApiService } from '../../../pipeline/services/crm-pipeline-api.service';
import { Pipeline, PipelineStep } from '../../../pipeline/models/pipeline.model';
import { DealDetail } from '../../models/deal.model';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ContactPickerComponent, ContactPickerValue } from '../../../../shared/pickers/contact-picker/contact-picker.component';
import { OrganisationPickerComponent, OrganisationPickerValue } from '../../../../shared/pickers/organisation-picker/organisation-picker.component';
import { CommercialPickerComponent } from '../../../../shared/pickers/commercial-picker/commercial-picker.component';

@Component({
  selector: 'app-deal-form',
  imports: [FormsModule, RouterLink, ContactPickerComponent, OrganisationPickerComponent, CommercialPickerComponent],
  templateUrl: './deal-form.component.html',
  styleUrl: './deal-form.component.scss'
})
/** Routed page for creating a new deal or editing an existing one (mode driven by route data). */
export class DealFormComponent implements OnInit {

  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly dealApi     = inject(CrmDealApiService);
  private readonly pipelineApi = inject(CrmPipelineApiService);
  private readonly feedback    = inject(FeedbackService);

  readonly loading   = signal(false);
  readonly pipelines = signal<Pipeline[]>([]);
  readonly steps     = signal<PipelineStep[]>([]);

  mode: 'create' | 'edit' = 'create';
  private publicId = '';

  form = {
    title:                '',
    amount:               '' as number | '',
    currency:             'EUR',
    pipelinePublicId:     '',
    stagePublicId:        '',
    contactPublicId:      '',
    organisationPublicId: '',
    assignedToPublicId:   '',
    expectedCloseDate:    '',
    notes:                ''
  };

  get isValid(): boolean {
    const base = this.form.title.trim().length > 0;
    if (this.mode === 'edit') return base;
    return base
        && this.form.pipelinePublicId.length > 0
        && this.form.stagePublicId.length > 0
        && this.form.contactPublicId.length > 0
        && this.form.assignedToPublicId.length > 0;
  }

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] ?? 'create';
    this.pipelineApi.findAll().subscribe({
      next: list => {
        this.pipelines.set(list);
        if (this.mode === 'edit') {
          this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
          this.loadExisting();
        } else {
          const def = list.find(p => p.isDefault) ?? list[0];
          if (def) { this.form.pipelinePublicId = def.publicId; this.onPipelineChange(); }
        }
      },
      error: () => this.feedback.showError('Impossible de charger les pipelines.')
    });
  }

  onPipelineChange(): void {
    const p = this.pipelines().find(p => p.publicId === this.form.pipelinePublicId);
    this.steps.set(p?.steps ?? []);
    this.form.stagePublicId = this.steps()[0]?.publicId ?? '';
  }

  onContactSelected(v: ContactPickerValue | null): void {
    this.form.contactPublicId = v?.publicId ?? '';
  }

  onOrgSelected(v: OrganisationPickerValue | null): void {
    this.form.organisationPublicId = v?.publicId ?? '';
  }

  onCommercialSelected(publicId: string | null): void {
    this.form.assignedToPublicId = publicId ?? '';
  }

  private loadExisting(): void {
    this.loading.set(true);
    this.dealApi.getByPublicId(this.publicId).subscribe({
      next: deal => {
        this.form.title                = deal.title;
        this.form.amount               = deal.amount ?? '';
        this.form.currency             = deal.currency;
        this.form.pipelinePublicId     = deal.pipelinePublicId;
        this.form.stagePublicId        = deal.stagePublicId;
        this.form.contactPublicId      = deal.contactPublicId ?? '';
        this.form.organisationPublicId = deal.organisationPublicId ?? '';
        this.form.assignedToPublicId   = deal.assignedToPublicId;
        this.form.expectedCloseDate    = deal.expectedCloseDate ?? '';
        this.form.notes                = deal.notes ?? '';
        this.onPipelineChange();
        this.form.stagePublicId = deal.stagePublicId;
        this.loading.set(false);
      },
      error: () => { this.feedback.showError('Impossible de charger le deal.'); this.loading.set(false); }
    });
  }

  submit(): void {
    if (!this.isValid) return;
    this.loading.set(true);

    if (this.mode === 'create') {
      this.dealApi.create({
        title:                this.form.title.trim(),
        amount:               this.form.amount !== '' ? Number(this.form.amount) : undefined,
        currency:             this.form.currency || undefined,
        pipelinePublicId:     this.form.pipelinePublicId,
        stagePublicId:        this.form.stagePublicId,
        contactPublicId:      this.form.contactPublicId,
        organisationPublicId: this.form.organisationPublicId || undefined,
        assignedToPublicId:   this.form.assignedToPublicId,
        expectedCloseDate:    this.form.expectedCloseDate || undefined,
        notes:                this.form.notes.trim() || undefined
      }).subscribe({
        next: deal => this.onSuccess(deal),
        error: () => { this.feedback.showError('Erreur lors de la création.'); this.loading.set(false); }
      });
    } else {
      this.dealApi.update(this.publicId, {
        title:             this.form.title.trim() || undefined,
        amount:            this.form.amount !== '' ? Number(this.form.amount) : undefined,
        currency:          this.form.currency || undefined,
        expectedCloseDate: this.form.expectedCloseDate || undefined,
        notes:             this.form.notes.trim() || undefined
      }).subscribe({
        next: deal => this.onSuccess(deal),
        error: () => { this.feedback.showError('Erreur lors de la mise à jour.'); this.loading.set(false); }
      });
    }
  }

  private onSuccess(deal: DealDetail): void {
    this.feedback.showSuccess(this.mode === 'create' ? 'Deal créé.' : 'Deal mis à jour.');
    this.loading.set(false);
    this.router.navigate(['/crm/deals', deal.publicId]);
  }
}
