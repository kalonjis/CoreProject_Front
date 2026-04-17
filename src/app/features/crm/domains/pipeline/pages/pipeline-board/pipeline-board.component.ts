import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDropListGroup, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { CrmPipelineApiService } from '../../services/crm-pipeline-api.service';
import { CrmDealApiService } from '../../../deal/services/crm-deal-api.service';
import { Pipeline, PipelineStep } from '../../models/pipeline.model';
import { DealStatus, DealSummary } from '../../../deal/models/deal.model';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

/** Holds the deal and target step awaiting the user's lost-reason input before the move is confirmed. */
interface PendingLostMove {
  deal: DealSummary;
  targetStep: PipelineStep;
}

@Component({
  selector: 'app-pipeline-board',
  imports: [DecimalPipe, FormsModule, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder],
  templateUrl: './pipeline-board.component.html',
  styleUrl: './pipeline-board.component.scss'
})
/**
 * Kanban pipeline board with drag-and-drop deal cards, per-stage totals, optimistic stage moves,
 * and mandatory lost-reason modal when a deal is moved to a lost step.
 */
export class PipelineBoardComponent implements OnInit {

  private readonly pipelineApi = inject(CrmPipelineApiService);
  private readonly dealApi     = inject(CrmDealApiService);
  private readonly router      = inject(Router);
  private readonly confirm     = inject(ConfirmDialogService);
  private readonly feedback    = inject(FeedbackService);

  readonly allPipelines = signal<Pipeline[]>([]);
  readonly pipeline     = signal<Pipeline | null>(null);
  readonly deals        = signal<DealSummary[]>([]);
  readonly loading      = signal(false);
  readonly error        = signal<string | null>(null);

  // Lost reason modal state
  readonly showLostModal   = signal(false);
  readonly pendingLostMove = signal<PendingLostMove | null>(null);
  lostReason = '';

  get lostReasonValid(): boolean {
    return this.lostReason.trim().length > 0;
  }

  readonly dealsByStage = computed(() => {
    const map = new Map<string, DealSummary[]>();
    for (const step of this.pipeline()?.steps ?? []) {
      map.set(step.publicId, []);
    }
    for (const deal of this.deals()) {
      const list = map.get(deal.stagePublicId);
      if (list) list.push(deal);
    }
    return map;
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.pipelineApi.findAll().subscribe({
      next: list => {
        if (list.length === 0) {
          this.error.set('Aucun pipeline configuré. Créez un pipeline via les paramètres admin.');
          this.loading.set(false);
          return;
        }
        this.allPipelines.set(list);
        const pipeline = list.find(p => p.isDefault) ?? list[0];
        this.pipeline.set(pipeline);
        this.loadDeals(pipeline.publicId);
      },
      error: () => { this.error.set('Impossible de charger le pipeline.'); this.loading.set(false); }
    });
  }

  selectPipeline(publicId: string): void {
    const p = this.allPipelines().find(p => p.publicId === publicId);
    if (!p || p.publicId === this.pipeline()?.publicId) return;
    this.pipeline.set(p);
    this.deals.set([]);
    this.loading.set(true);
    this.loadDeals(p.publicId);
  }

  private loadDeals(pipelinePublicId: string): void {
    this.dealApi.findAll({ pipelinePublicId }, 0, 200).subscribe({
      next: page => { this.deals.set(page.content); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger les deals.'); this.loading.set(false); }
    });
  }

  getStepDeals(step: PipelineStep): DealSummary[] {
    return this.dealsByStage().get(step.publicId) ?? [];
  }

  totalAmount(step: PipelineStep): number {
    return this.getStepDeals(step)
      .reduce((sum, d) => sum + (d.amount ?? 0), 0);
  }

  isDealDraggable(deal: DealSummary): boolean {
    return deal.status === DealStatus.OPEN;
  }

  async onDrop(event: CdkDragDrop<DealSummary[]>, targetStep: PipelineStep): Promise<void> {
    const deal: DealSummary = event.item.data;
    if (deal.stagePublicId === targetStep.publicId) return;

    // WON → simple confirm dialog
    if (targetStep.isWon) {
      const confirmed = await this.confirm.confirm({
        title:             'Marquer comme Gagné',
        message:           `Voulez-vous clore le deal "${deal.title}" comme Gagné ? Cette action est irréversible.`,
        confirmButtonText: 'Oui, marquer Gagné',
        cancelButtonText:  'Annuler',
        type:              'info'
      }).then(() => true).catch(() => false);

      if (!confirmed) return;

      this.dealApi.moveStage(deal.publicId, { stagePublicId: targetStep.publicId }).subscribe({
        next: () => {
          this.deals.update(list =>
            list.map(d => d.publicId === deal.publicId
              ? { ...d, stagePublicId: targetStep.publicId, stageName: targetStep.name, status: DealStatus.WON }
              : d
            )
          );
          this.feedback.showSuccess(`Deal "${deal.title}" marqué comme Gagné.`);
        },
        error: () => this.feedback.showError('Impossible de clore le deal.')
      });
      return;
    }

    // LOST → modal avec raison obligatoire
    if (targetStep.isLost) {
      this.lostReason = '';
      this.pendingLostMove.set({ deal, targetStep });
      this.showLostModal.set(true);
      return;
    }

    // Mouvement normal → optimistic update
    const previousStagePublicId = deal.stagePublicId;
    const previousStageName     = deal.stageName;

    this.deals.update(list =>
      list.map(d => d.publicId === deal.publicId
        ? { ...d, stagePublicId: targetStep.publicId, stageName: targetStep.name }
        : d
      )
    );

    this.dealApi.moveStage(deal.publicId, { stagePublicId: targetStep.publicId }).subscribe({
      error: () => {
        this.deals.update(list =>
          list.map(d => d.publicId === deal.publicId
            ? { ...d, stagePublicId: previousStagePublicId, stageName: previousStageName }
            : d
          )
        );
        this.feedback.showError('Impossible de déplacer le deal.');
      }
    });
  }

  confirmLost(): void {
    if (!this.lostReasonValid) return;
    const pending = this.pendingLostMove();
    if (!pending) return;

    this.showLostModal.set(false);

    this.dealApi.moveStage(pending.deal.publicId, {
      stagePublicId: pending.targetStep.publicId,
      lostReason: this.lostReason.trim()
    }).subscribe({
      next: () => {
        this.deals.update(list =>
          list.map(d => d.publicId === pending.deal.publicId
            ? { ...d, stagePublicId: pending.targetStep.publicId, stageName: pending.targetStep.name, status: DealStatus.LOST }
            : d
          )
        );
        this.feedback.showSuccess(`Deal "${pending.deal.title}" marqué comme Perdu.`);
        this.pendingLostMove.set(null);
        this.lostReason = '';
      },
      error: () => {
        this.feedback.showError('Impossible de clore le deal.');
        this.pendingLostMove.set(null);
      }
    });
  }

  cancelLostModal(): void {
    this.showLostModal.set(false);
    this.pendingLostMove.set(null);
    this.lostReason = '';
  }

  viewDeal(publicId: string): void { this.router.navigate(['/crm/deals', publicId]); }
  goDeals(): void  { this.router.navigate(['/crm/deals']); }
  goStats(): void  { this.router.navigate(['/crm/pipeline/stats']); }
}
