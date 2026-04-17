/**
 * HTTP client for the CRM Today API ({@code /api/crm/today}).
 *
 * Retrieves the aggregated daily summary for the authenticated commercial.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TodaySummary } from '../models/today.model';

@Injectable({ providedIn: 'root' })
export class CrmTodayApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/today';

  getSummary(): Observable<TodaySummary> {
    return this.http.get<TodaySummary>(this.base);
  }
}
