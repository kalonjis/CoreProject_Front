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

  readonly allPipelines = signal<Pipeline[]>([]);
  readonly stats        = signal<PipelineStats | null>(null);
  readonly loading      = signal(false);
  readonly error        = signal<string | null>(null);

  readonly topOfFunnel      = computed(() => this.stats()?.stages[0]?.dealsEntered ?? 0);
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

  goBoard(): void { this.router.navigate(['/crm/pipeline']); }
}
