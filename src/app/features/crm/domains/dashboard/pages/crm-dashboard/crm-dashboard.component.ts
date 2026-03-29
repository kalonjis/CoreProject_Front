import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CrmDashboardApiService }  from '../../services/crm-dashboard-api.service';
import { CrmStats }                from '../../models/crm-stats.model';
import { ChangeLogWidgetComponent } from '../../../crm-change-log/components/change-log-widget/change-log-widget.component';

@Component({
  selector: 'app-crm-dashboard',
  imports: [DecimalPipe, ChangeLogWidgetComponent],
  templateUrl: './crm-dashboard.component.html',
  styleUrl: './crm-dashboard.component.scss'
})
export class CrmDashboardComponent implements OnInit {

  private readonly dashboardApi = inject(CrmDashboardApiService);
  private readonly router       = inject(Router);

  readonly stats   = signal<CrmStats | null>(null);
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);

  ngOnInit(): void {
    this.dashboardApi.getStats().subscribe({
      next:  s  => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger les statistiques.'); this.loading.set(false); }
    });
  }

  get leadsTotal(): number {
    const s = this.stats();
    return s ? s.leadsNew + s.leadsInReview : 0;
  }

  get ticketsActive(): number {
    const s = this.stats();
    return s ? s.ticketsOpen + s.ticketsInProgress : 0;
  }

  navigate(path: string): void { this.router.navigate(['/crm', path]); }
}
