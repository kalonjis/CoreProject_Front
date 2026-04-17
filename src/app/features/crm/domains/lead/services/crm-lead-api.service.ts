/**
 * HTTP client for the CRM Lead API ({@code /api/crm/leads}).
 *
 * Covers paginated listing, detail retrieval, and all lifecycle operations:
 * enrich, assign, mark-in-review, create, convert, and reject.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LeadDetail,
  LeadFilter,
  LeadSummary,
  EnrichLeadRequest,
  AssignLeadRequest,
  ConvertLeadRequest,
  RejectLeadRequest,
  CreateLeadRequest
} from '../models/lead.model';
import { Page } from '../../../shared/models/page.model';

@Injectable({ providedIn: 'root' })
export class CrmLeadApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/leads';

  findAll(
    filter: LeadFilter,
    page: number,
    size: number,
    sort = 'submittedAt',
    direction: 'asc' | 'desc' = 'desc'
  ): Observable<Page<LeadSummary>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', `${sort},${direction}`);

    if (filter.status)             params = params.set('status', filter.status);
    if (filter.leadType)           params = params.set('leadType', filter.leadType);
    if (filter.assignedToPublicId) params = params.set('assignedToPublicId', filter.assignedToPublicId);
    if (filter.unassignedOnly)     params = params.set('unassignedOnly', 'true');
    if (filter.activeOnly)         params = params.set('activeOnly', 'true');
    if (filter.keyword?.trim())    params = params.set('keyword', filter.keyword.trim());
    if (filter.submittedFrom)      params = params.set('submittedFrom', filter.submittedFrom);
    if (filter.submittedTo)        params = params.set('submittedTo', filter.submittedTo);

    return this.http.get<Page<LeadSummary>>(this.base, { params });
  }

  getByPublicId(publicId: string): Observable<LeadDetail> {
    return this.http.get<LeadDetail>(`${this.base}/${publicId}`);
  }

  enrich(publicId: string, body: EnrichLeadRequest): Observable<LeadDetail> {
    return this.http.patch<LeadDetail>(`${this.base}/${publicId}/enrich`, body);
  }

  assign(publicId: string, body: AssignLeadRequest): Observable<LeadDetail> {
    return this.http.patch<LeadDetail>(`${this.base}/${publicId}/assign`, body);
  }

  markInReview(publicId: string): Observable<LeadDetail> {
    return this.http.patch<LeadDetail>(`${this.base}/${publicId}/review`, {});
  }

  create(body: CreateLeadRequest): Observable<LeadDetail> {
    return this.http.post<LeadDetail>(this.base, body);
  }

  convert(publicId: string, body: ConvertLeadRequest): Observable<LeadDetail> {
    return this.http.post<LeadDetail>(`${this.base}/${publicId}/convert`, body);
  }

  reject(publicId: string, body: RejectLeadRequest): Observable<LeadDetail> {
    return this.http.patch<LeadDetail>(`${this.base}/${publicId}/reject`, body);
  }
}
