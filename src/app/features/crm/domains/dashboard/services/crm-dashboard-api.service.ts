import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrmStats } from '../models/crm-stats.model';

@Injectable({ providedIn: 'root' })
export class CrmDashboardApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/stats';

  getStats(): Observable<CrmStats> {
    return this.http.get<CrmStats>(this.base);
  }
}
