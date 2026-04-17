import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmDealApiService } from '../../services/crm-deal-api.service';
import { CrmPipelineApiService } from '../../../pipeline/services/crm-pipeline-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { PipelineStep } from '../../../pipeline/models/pipeline.model';

@Component({
  selector: 'app-deal-action-move-stage',
  imports: [FormsModule],
  templateUrl: './deal-action-move-stage.component.html',
  styleUrl: './deal-action-move-stage.component.scss'
})
/** Form for moving a deal to a different pipeline stage, with a mandatory lost-reason modal when targeting a lost step. */
export class DealActionMoveStageComponent implements OnInit {
  @Input({ required: true }) publicId!: string;
  @Input({ required: true }) pipelinePublicId!: string;
  @Input({ required: true }) currentStagePublicId!: string;
  @Output() moved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly dealApi     = inject(CrmDealApiService);
  private readonly pipelineApi = inject(CrmPipelineApiService);
  private readonly feedback    = inject(FeedbackService);

  readonly loading       = signal(false);
  readonly steps         = signal<PipelineStep[]>([]);
  readonly showLostModal = signal(false);

  selectedStagePublicId = '';
  lostReason            = '';

  get selectedStep(): PipelineStep | null {
    return this.steps().find(s => s.publicId === this.selectedStagePublicId) ?? null;
  }

  get isValid(): boolean {
    return this.selectedStagePublicId.trim().length > 0
        && this.selectedStagePublicId !== this.currentStagePublicId;
  }

  get lostReasonValid(): boolean {
    return this.lostReason.trim().length > 0;
  }

  ngOnInit(): void {
    this.pipelineApi.getByPublicId(this.pipelinePublicId).subscribe({
      next: pipeline => {
        this.steps.set(pipeline.steps.filter(s => s.publicId !== this.currentStagePublicId));
      },
      error: () => this.feedback.showError('Impossible de charger les étapes.')
    });
  }

  submit(): void {
    if (!this.isValid) return;
    const step = this.selectedStep;
    if (step?.isLost) {
      this.lostReason = '';
      this.showLostModal.set(true);
    } else {
      this.doMove();
    }
  }

  confirmLost(): void {
    if (!this.lostReasonValid) return;
    this.showLostModal.set(false);
    this.doMove(this.lostReason.trim());
  }

  cancelLostModal(): void {
    this.showLostModal.set(false);
    this.lostReason = '';
  }

  private doMove(lostReason?: string): void {
    this.loading.set(true);
    this.dealApi.moveStage(this.publicId, {
      stagePublicId: this.selectedStagePublicId,
      ...(lostReason ? { lostReason } : {})
    }).subscribe({
      next: () => {
        this.feedback.showSuccess('Deal déplacé avec succès.');
        this.moved.emit();
        this.loading.set(false);
      },
      error: () => {
        this.feedback.showError('Impossible de déplacer le deal.');
        this.loading.set(false);
      }
    });
  }
}
