import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrmStats, RevenueMonth } from '../models/crm-stats.model';

/**
 * HTTP client service for the CRM statistics API.
 * Wraps {@code /api/crm/stats} endpoints for dashboard KPIs and revenue history.
 */
@Injectable({ providedIn: 'root' })
export class CrmDashboardApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/stats';

  /** Returns aggregate CRM KPI statistics for the dashboard. */
  getStats(): Observable<CrmStats> {
    return this.http.get<CrmStats>(this.base);
  }

  /** Returns monthly revenue history for the last {@code months} months. */
  getRevenueHistory(months = 12): Observable<RevenueMonth[]> {
    return this.http.get<RevenueMonth[]>(`${this.base}/revenue-history`, { params: { months } });
  }
}
