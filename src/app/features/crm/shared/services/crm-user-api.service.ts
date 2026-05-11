/**
 * HTTP client for CRM user-related endpoints ({@code /api/crm/users}).
 *
 * Provides access to the list of active commercials used in assignment pickers
 * across leads, deals, support tickets, and commercial actions.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommercialSummary } from '../models/commercial.model';

@Injectable({ providedIn: 'root' })
export class CrmUserApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/users';

  /** Returns all active commercials available for assignment across the CRM. */
  getCommercials(): Observable<CommercialSummary[]> {
    return this.http.get<CommercialSummary[]>(`${this.base}/commercials`);
  }
}
