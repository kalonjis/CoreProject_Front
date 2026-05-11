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
  /** Public ID of the deal to move. */
  @Input({ required: true }) publicId!: string;
  /** Public ID of the pipeline the deal belongs to, used to load available stages. */
  @Input({ required: true }) pipelinePublicId!: string;
  /** Public ID of the deal's current stage, excluded from the target options. */
  @Input({ required: true }) currentStagePublicId!: string;
  /** Emitted after the deal has been successfully moved. */
  @Output() moved     = new EventEmitter<void>();
  /** Emitted when the user dismisses the form without saving. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly dealApi     = inject(CrmDealApiService);
  private readonly pipelineApi = inject(CrmPipelineApiService);
  private readonly feedback    = inject(FeedbackService);

  /** True while the move request is in flight. */
  readonly loading       = signal(false);
  /** Available pipeline steps (excluding the current stage). */
  readonly steps         = signal<PipelineStep[]>([]);
  /** Controls visibility of the lost-reason confirmation modal. */
  readonly showLostModal = signal(false);

  selectedStagePublicId = '';
  lostReason            = '';

  /** Returns the full pipeline step object for the currently selected stage, or null if none. */
  get selectedStep(): PipelineStep | null {
    return this.steps().find(s => s.publicId === this.selectedStagePublicId) ?? null;
  }

  /** True when a different stage is selected. */
  get isValid(): boolean {
    return this.selectedStagePublicId.trim().length > 0
        && this.selectedStagePublicId !== this.currentStagePublicId;
  }

  /** True when a non-empty lost reason has been entered. */
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

  /** Validates the selection and either opens the lost-reason modal or directly moves the deal. */
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
