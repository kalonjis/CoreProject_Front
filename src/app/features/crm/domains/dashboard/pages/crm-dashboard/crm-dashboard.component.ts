import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CrmDashboardApiService }   from '../../services/crm-dashboard-api.service';
import { CrmTodayApiService }       from '../../../today/services/crm-today-api.service';
import { CrmStats, RevenueMonth }   from '../../models/crm-stats.model';
import { TodaySummary }             from '../../../today/models/today.model';
import { RevenueChartComponent }   from '../../components/revenue-chart/revenue-chart.component';
import { ActivityFeedComponent }   from '../../components/activity-feed/activity-feed.component';
import { CommercialActionResponse, COMMERCIAL_ACTION_TYPE_LABELS } from '../../../commercial-action/models/commercial-action.model';

@Component({
  selector: 'app-crm-dashboard',
  imports: [DecimalPipe, RevenueChartComponent, ActivityFeedComponent],
  templateUrl: './crm-dashboard.component.html',
  styleUrl: './crm-dashboard.component.scss'
})
/**
 * Main CRM dashboard page displaying KPI metrics, revenue history chart,
 * overdue actions, deals closing soon, and the activity feed.
 */
export class CrmDashboardComponent implements OnInit {

  private readonly dashboardApi = inject(CrmDashboardApiService);
  private readonly todayApi     = inject(CrmTodayApiService);
  private readonly router       = inject(Router);

  /** Global CRM KPI stats (contacts, deals, revenue, etc.); null while loading. */
  readonly stats          = signal<CrmStats | null>(null);
  /** Today's work summary (overdue actions, closing deals, open tickets); null while loading. */
  readonly today          = signal<TodaySummary | null>(null);
  /** Monthly revenue data for the last 12 months used by the chart. */
  readonly revenueHistory = signal<RevenueMonth[]>([]);
  /** Whether the initial stats load is in progress. */
  readonly loading        = signal(true);
  /** Error message shown if the stats request fails. */
  readonly error          = signal<string | null>(null);

  readonly ACTION_TYPE_LABELS = COMMERCIAL_ACTION_TYPE_LABELS;

  /** Sum of new and in-review leads for the "Leads actifs" KPI card. */
  readonly leadsTotal    = computed(() => {
    const s = this.stats();
    return s ? s.leadsNew + s.leadsInReview : 0;
  });

  /** Sum of open and in-progress tickets for the "Tickets actifs" KPI card. */
  readonly ticketsActive = computed(() => {
    const s = this.stats();
    return s ? s.ticketsOpen + s.ticketsInProgress : 0;
  });

  /** Top 4 overdue commercial actions shown in the dashboard alert section. */
  readonly overdueActions = computed(() =>
    this.today()?.overdueActions.slice(0, 4) ?? []
  );

  /** Top 3 deals closing soon shown in the dashboard deal spotlight. */
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
    this.dashboardApi.getRevenueHistory(12).subscribe({
      next:  h => this.revenueHistory.set(h),
      error: () => {}
    });
  }

  /** Navigates to a CRM sub-route by appending path to /crm. */
  navigate(path: string): void { this.router.navigate(['/crm', path]); }

  /** Navigates to the detail page for the given commercial action. */
  goAction(action: CommercialActionResponse): void {
    this.router.navigate(['/crm/commercial-actions', action.publicId]);
  }

  /** Extracts up to 2 capitalised initials from a display name for avatar placeholders. */
  initials(name: string | null): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
}
