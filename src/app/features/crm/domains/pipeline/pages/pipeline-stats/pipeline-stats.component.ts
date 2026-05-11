import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CrmPipelineApiService } from '../../services/crm-pipeline-api.service';
import { Pipeline, PipelineStats } from '../../models/pipeline.model';

@Component({
  selector: 'app-pipeline-stats',
  imports: [DecimalPipe],
  templateUrl: './pipeline-stats.component.html',
  styleUrl: './pipeline-stats.component.scss'
})
/** Pipeline statistics page showing per-stage conversion rates, deal counts, and average cycle days. */
export class PipelineStatsComponent implements OnInit {

  private readonly pipelineApi = inject(CrmPipelineApiService);
  private readonly router      = inject(Router);

  /** All pipelines available for the pipeline selector. */
  readonly allPipelines = signal<Pipeline[]>([]);
  /** Statistics for the currently selected pipeline; null while loading. */
  readonly stats        = signal<PipelineStats | null>(null);
  /** Whether a pipeline or stats request is in flight. */
  readonly loading      = signal(false);
  /** Error message shown if a request fails. */
  readonly error        = signal<string | null>(null);

  /** Number of deals that entered the first stage (top-of-funnel entry count). */
  readonly topOfFunnel      = computed(() => this.stats()?.stages[0]?.dealsEntered ?? 0);
  /** Total number of deals currently sitting in any stage of the pipeline. */
  readonly totalDealsCurrently = computed(() =>
    this.stats()?.stages.reduce((sum, s) => sum + s.dealsCurrently, 0) ?? 0
  );

  ngOnInit(): void {
    this.loading.set(true);
    this.pipelineApi.findAll().subscribe({
      next: list => {
        if (list.length === 0) {
          this.error.set('Aucun pipeline configuré.');
          this.loading.set(false);
          return;
        }
        this.allPipelines.set(list);
        const pipeline = list.find(p => p.isDefault) ?? list[0];
        this.loadStats(pipeline.publicId);
      },
      error: () => { this.error.set('Impossible de charger les pipelines.'); this.loading.set(false); }
    });
  }

  /** Loads stats for the given pipeline unless it is already the active one. */
  selectPipeline(publicId: string): void {
    if (publicId === this.stats()?.pipelinePublicId) return;
    this.loading.set(true);
    this.stats.set(null);
    this.loadStats(publicId);
  }

  private loadStats(publicId: string): void {
    this.pipelineApi.getStats(publicId).subscribe({
      next: s  => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger les statistiques.'); this.loading.set(false); }
    });
  }

  /** Navigates back to the pipeline board. */
  goBoard(): void { this.router.navigate(['/crm/pipeline']); }
}
