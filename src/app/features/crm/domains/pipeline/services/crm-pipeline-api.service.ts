import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pipeline } from '../models/pipeline.model';

@Injectable({ providedIn: 'root' })
export class CrmPipelineApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/pipelines';

  findAll(): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(this.base);
  }

  getDefault(): Observable<Pipeline> {
    return this.http.get<Pipeline>(`${this.base}/default`);
  }

  getByPublicId(publicId: string): Observable<Pipeline> {
    return this.http.get<Pipeline>(`${this.base}/${publicId}`);
  }
}
