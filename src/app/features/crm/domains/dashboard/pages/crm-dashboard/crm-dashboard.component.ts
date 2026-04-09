import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CrmDashboardApiService }   from '../../services/crm-dashboard-api.service';
import { CrmTodayApiService }       from '../../../today/services/crm-today-api.service';
import { CrmStats }                 from '../../models/crm-stats.model';
import { TodaySummary }             from '../../../today/models/today.model';
import { ChangeLogWidgetComponent } from '../../../crm-change-log/components/change-log-widget/change-log-widget.component';
import { CommercialActionResponse, COMMERCIAL_ACTION_TYPE_LABELS } from '../../../commercial-action/models/commercial-action.model';

@Component({
  selector: 'app-crm-dashboard',
  imports: [DecimalPipe, ChangeLogWidgetComponent],
  templateUrl: './crm-dashboard.component.html',
  styleUrl: './crm-dashboard.component.scss'
})
export class CrmDashboardComponent implements OnInit {

  private readonly dashboardApi = inject(CrmDashboardApiService);
  private readonly todayApi     = inject(CrmTodayApiService);
  private readonly router       = inject(Router);

  readonly stats       = signal<CrmStats | null>(null);
  readonly today       = signal<TodaySummary | null>(null);
  readonly loading     = signal(true);
  readonly error       = signal<string | null>(null);

  readonly ACTION_TYPE_LABELS = COMMERCIAL_ACTION_TYPE_LABELS;

  readonly leadsTotal    = computed(() => {
    const s = this.stats();
    return s ? s.leadsNew + s.leadsInReview : 0;
  });

  readonly ticketsActive = computed(() => {
    const s = this.stats();
    return s ? s.ticketsOpen + s.ticketsInProgress : 0;
  });

  readonly overdueActions = computed(() =>
    this.today()?.overdueActions.slice(0, 4) ?? []
  );

  readonly dealsClosingSoon = computed(() =>
    this.today()?.dealsClosingSoon.slice(0, 3) ?? []
  );

  ngOnInit(): void {
    this.dashboardApi.getStats().subscribe({
      next:  s  => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger les statistiques.'); this.loading.set(false); }
    });
    this.todayApi.getSummary().subscribe({
      next: s => this.today.set(s),
      error: () => {}
    });
  }

  navigate(path: string): void { this.router.navigate(['/crm', path]); }

  goAction(action: CommercialActionResponse): void {
    this.router.navigate(['/crm/commercial-actions', action.publicId]);
  }

  initials(name: string | null): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
}
