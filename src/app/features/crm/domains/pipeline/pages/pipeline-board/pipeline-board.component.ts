import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDropListGroup, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { CrmPipelineApiService } from '../../services/crm-pipeline-api.service';
import { CrmDealApiService } from '../../../deal/services/crm-deal-api.service';
import { Pipeline, PipelineStep } from '../../models/pipeline.model';
import { DealStatus, DealSummary } from '../../../deal/models/deal.model';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-pipeline-board',
  imports: [DecimalPipe, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder],
  templateUrl: './pipeline-board.component.html',
  styleUrl: './pipeline-board.component.scss'
})
export class PipelineBoardComponent implements OnInit {

  private readonly pipelineApi = inject(CrmPipelineApiService);
  private readonly dealApi     = inject(CrmDealApiService);
  private readonly router      = inject(Router);
  private readonly confirm     = inject(ConfirmDialogService);
  private readonly feedback    = inject(FeedbackService);

  readonly pipeline = signal<Pipeline | null>(null);
  readonly deals    = signal<DealSummary[]>([]);
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);

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
          this.error.set('Aucun pipeline configuré. Créez un pipeline via l\'API ou l\'admin.');
          this.loading.set(false);
          return;
        }
        const pipeline = list.find(p => p.isDefault) ?? list[0];
        this.pipeline.set(pipeline);
        this.loadDeals(pipeline.publicId);
      },
      error: () => { this.error.set('Impossible de charger le pipeline.'); this.loading.set(false); }
    });
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

    // Confirmation obligatoire avant de clore un deal
    if (targetStep.isWon || targetStep.isLost) {
      const label  = targetStep.isWon ? 'Gagné' : 'Perdu';
      const type   = targetStep.isWon ? 'info' : 'danger';
      const confirmed = await this.confirm.confirm({
        title:             `Marquer comme ${label}`,
        message:           `Voulez-vous clore le deal "${deal.title}" comme ${label} ? Cette action est irréversible.`,
        confirmButtonText: `Oui, marquer ${label}`,
        cancelButtonText:  'Annuler',
        type
      }).then(() => true).catch(() => false);

      if (!confirmed) return;

      // Pas d'optimistic update pour une action irréversible
      this.dealApi.moveStage(deal.publicId, { stagePublicId: targetStep.publicId }).subscribe({
        next: () => {
          this.deals.update(list =>
            list.map(d => d.publicId === deal.publicId
              ? { ...d, stagePublicId: targetStep.publicId, stageName: targetStep.name, status: targetStep.isWon ? DealStatus.WON : DealStatus.LOST }
              : d
            )
          );
          this.feedback.showSuccess(`Deal "${deal.title}" marqué comme ${label}.`);
        },
        error: () => this.feedback.showError(`Impossible de clore le deal.`)
      });
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

  viewDeal(publicId: string): void { this.router.navigate(['/crm/deals', publicId]); }
  goDeals(): void { this.router.navigate(['/crm/deals']); }
}
