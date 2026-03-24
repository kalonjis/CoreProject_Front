import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Pipeline,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  CreatePipelineStepRequest,
  UpdatePipelineStepRequest,
  ReorderPipelineStepsRequest
} from '../models/pipeline.model';

@Injectable({ providedIn: 'root' })
export class CrmPipelineApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/pipelines';

  // ─── Read ────────────────────────────────────────────────────────────────

  findAll(): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(this.base);
  }

  getDefault(): Observable<Pipeline> {
    return this.http.get<Pipeline>(`${this.base}/default`);
  }

  getByPublicId(publicId: string): Observable<Pipeline> {
    return this.http.get<Pipeline>(`${this.base}/${publicId}`);
  }

  // ─── Pipeline CRUD ───────────────────────────────────────────────────────

  create(req: CreatePipelineRequest): Observable<Pipeline> {
    return this.http.post<Pipeline>(this.base, req);
  }

  update(publicId: string, req: UpdatePipelineRequest): Observable<Pipeline> {
    return this.http.patch<Pipeline>(`${this.base}/${publicId}`, req);
  }

  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${publicId}`);
  }

  // ─── Step CRUD ───────────────────────────────────────────────────────────

  addStep(pipelinePublicId: string, req: CreatePipelineStepRequest): Observable<Pipeline> {
    return this.http.post<Pipeline>(`${this.base}/${pipelinePublicId}/steps`, req);
  }

  updateStep(pipelinePublicId: string, stepPublicId: string, req: UpdatePipelineStepRequest): Observable<Pipeline> {
    return this.http.patch<Pipeline>(`${this.base}/${pipelinePublicId}/steps/${stepPublicId}`, req);
  }

  deleteStep(pipelinePublicId: string, stepPublicId: string): Observable<Pipeline> {
    return this.http.delete<Pipeline>(`${this.base}/${pipelinePublicId}/steps/${stepPublicId}`);
  }

  reorderSteps(pipelinePublicId: string, req: ReorderPipelineStepsRequest): Observable<Pipeline> {
    return this.http.patch<Pipeline>(`${this.base}/${pipelinePublicId}/steps/reorder`, req);
  }
}
