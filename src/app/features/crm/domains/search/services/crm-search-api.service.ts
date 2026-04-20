import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalSearchResponse } from '../models/search.model';

/**
 * HTTP client service for the CRM global search API.
 * Queries {@code /api/crm/search} across contacts, organisations, deals, and leads.
 */
@Injectable({ providedIn: 'root' })
export class CrmSearchApiService {

  private readonly http = inject(HttpClient);

  /** Performs a global keyword search across all major CRM entities. */
  search(q: string): Observable<GlobalSearchResponse> {
    return this.http.get<GlobalSearchResponse>('/api/crm/search', { params: { q } });
  }
}
