import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Pipeline,
  PipelineStats,
  CreatePipelineRequest,
  UpdatePipelineRequest,
  CreatePipelineStepRequest,
  UpdatePipelineStepRequest,
  ReorderPipelineStepsRequest
} from '../models/pipeline.model';

/**
 * HTTP client service for the CRM pipelines API.
 * Wraps all endpoints under {@code /api/crm/pipelines} including pipeline CRUD, stage management, and statistics.
 */
@Injectable({ providedIn: 'root' })
export class CrmPipelineApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/pipelines';

  // ─── Read ────────────────────────────────────────────────────────────────

  /** Returns all pipelines with their stages. */
  findAll(): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(this.base);
  }

  /** Returns the default pipeline. */
  getDefault(): Observable<Pipeline> {
    return this.http.get<Pipeline>(`${this.base}/default`);
  }

  /** Fetches a pipeline by its public identifier. */
  getByPublicId(publicId: string): Observable<Pipeline> {
    return this.http.get<Pipeline>(`${this.base}/${publicId}`);
  }

  /** Returns aggregated statistics for a pipeline. */
  getStats(publicId: string): Observable<PipelineStats> {
    return this.http.get<PipelineStats>(`${this.base}/${publicId}/stats`);
  }

  // ─── Pipeline CRUD ───────────────────────────────────────────────────────

  /** Creates a new pipeline. */
  create(req: CreatePipelineRequest): Observable<Pipeline> {
    return this.http.post<Pipeline>(this.base, req);
  }

  /** Partially updates a pipeline's metadata. */
  update(publicId: string, req: UpdatePipelineRequest): Observable<Pipeline> {
    return this.http.patch<Pipeline>(`${this.base}/${publicId}`, req);
  }

  /** Deletes a pipeline. */
  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${publicId}`);
  }

  // ─── Step CRUD ───────────────────────────────────────────────────────────

  /** Adds a new stage to a pipeline and returns the updated pipeline. */
  addStep(pipelinePublicId: string, req: CreatePipelineStepRequest): Observable<Pipeline> {
    return this.http.post<Pipeline>(`${this.base}/${pipelinePublicId}/steps`, req);
  }

  /** Updates a pipeline stage and returns the updated pipeline. */
  updateStep(pipelinePublicId: string, stepPublicId: string, req: UpdatePipelineStepRequest): Observable<Pipeline> {
    return this.http.patch<Pipeline>(`${this.base}/${pipelinePublicId}/steps/${stepPublicId}`, req);
  }

  /** Deletes a pipeline stage and returns the updated pipeline. */
  deleteStep(pipelinePublicId: string, stepPublicId: string): Observable<Pipeline> {
    return this.http.delete<Pipeline>(`${this.base}/${pipelinePublicId}/steps/${stepPublicId}`);
  }

  /** Reorders the stages of a pipeline and returns the updated pipeline. */
  reorderSteps(pipelinePublicId: string, req: ReorderPipelineStepsRequest): Observable<Pipeline> {
    return this.http.patch<Pipeline>(`${this.base}/${pipelinePublicId}/steps/reorder`, req);
  }
}
