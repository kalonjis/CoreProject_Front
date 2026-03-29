import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalSearchResponse } from '../models/search.model';

@Injectable({ providedIn: 'root' })
export class CrmSearchApiService {

  private readonly http = inject(HttpClient);

  search(q: string): Observable<GlobalSearchResponse> {
    return this.http.get<GlobalSearchResponse>('/api/crm/search', { params: { q } });
  }
}
