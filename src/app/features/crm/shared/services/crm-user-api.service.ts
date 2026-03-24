import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommercialSummary } from '../models/commercial.model';

@Injectable({ providedIn: 'root' })
export class CrmUserApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/users';

  getCommercials(): Observable<CommercialSummary[]> {
    return this.http.get<CommercialSummary[]>(`${this.base}/commercials`);
  }
}
