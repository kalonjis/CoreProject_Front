import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DealDetail,
  DealSummary,
  DealFilter,
  DealContactRoleResponse,
  CreateDealRequest,
  UpdateDealRequest,
  MoveDealStageRequest,
  ReassignDealRequest,
  AddDealContactRoleRequest,
  UpdateDealContactRoleRequest
} from '../models/deal.model';
import { Page } from '../../../shared/models/page.model';

/**
 * HTTP client service for the CRM deals API.
 * Wraps all endpoints under {@code /api/crm/deals} including CRUD, stage moves, reassignment, and contact-role management.
 */
@Injectable({ providedIn: 'root' })
export class CrmDealApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/deals';

  /** Returns a paginated, filtered list of deal summaries, sorted by creation date descending. */
  findAll(filter: DealFilter, page: number, size: number): Observable<Page<DealSummary>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    if (filter.keyword?.trim())         params = params.set('keyword', filter.keyword.trim());
    if (filter.status)                  params = params.set('status', filter.status);
    if (filter.pipelinePublicId)        params = params.set('pipelinePublicId', filter.pipelinePublicId);
    if (filter.stagePublicId)           params = params.set('stagePublicId', filter.stagePublicId);
    if (filter.assignedToPublicId)      params = params.set('assignedToPublicId', filter.assignedToPublicId);
    if (filter.contactPublicId)         params = params.set('contactPublicId', filter.contactPublicId);
    if (filter.organisationPublicId)    params = params.set('organisationPublicId', filter.organisationPublicId);
    if (filter.overdueOnly)             params = params.set('overdueOnly', 'true');
    if (filter.amountMin != null)       params = params.set('amountMin', filter.amountMin);
    if (filter.amountMax != null)       params = params.set('amountMax', filter.amountMax);
    if (filter.expectedCloseFrom)       params = params.set('expectedCloseFrom', filter.expectedCloseFrom);
    if (filter.expectedCloseTo)         params = params.set('expectedCloseTo', filter.expectedCloseTo);
    if (filter.tagPublicId)             params = params.set('tagPublicId', filter.tagPublicId);

    return this.http.get<Page<DealSummary>>(this.base, { params });
  }

  /** Fetches the full detail of a deal by its public identifier. */
  getByPublicId(publicId: string): Observable<DealDetail> {
    return this.http.get<DealDetail>(`${this.base}/${publicId}`);
  }

  /** Creates a new deal. */
  create(body: CreateDealRequest): Observable<DealDetail> {
    return this.http.post<DealDetail>(this.base, body);
  }

  /** Partially updates a deal's editable fields. */
  update(publicId: string, body: UpdateDealRequest): Observable<DealDetail> {
    return this.http.patch<DealDetail>(`${this.base}/${publicId}`, body);
  }

  /** Moves a deal to a different pipeline stage. */
  moveStage(publicId: string, body: MoveDealStageRequest): Observable<DealDetail> {
    return this.http.patch<DealDetail>(`${this.base}/${publicId}/stage`, body);
  }

  /** Reassigns a deal to another commercial. */
  reassign(publicId: string, body: ReassignDealRequest): Observable<DealDetail> {
    return this.http.patch<DealDetail>(`${this.base}/${publicId}/assign`, body);
  }

  // ─── Contact role endpoints ────────────────────────────────────────────────

  /** Adds a contact with a role to a deal. */
  addContact(publicId: string, body: AddDealContactRoleRequest): Observable<DealContactRoleResponse> {
    return this.http.post<DealContactRoleResponse>(`${this.base}/${publicId}/contacts`, body);
  }

  /** Removes a contact from a deal. */
  removeContact(publicId: string, contactPublicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${publicId}/contacts/${contactPublicId}`);
  }

  /** Updates the role of a contact already linked to a deal. */
  updateContactRole(publicId: string, contactPublicId: string, body: UpdateDealContactRoleRequest): Observable<DealContactRoleResponse> {
    return this.http.patch<DealContactRoleResponse>(`${this.base}/${publicId}/contacts/${contactPublicId}/role`, body);
  }

  /** Sets the primary contact for a deal. */
  setPrimaryContact(publicId: string, contactPublicId: string): Observable<DealContactRoleResponse> {
    return this.http.patch<DealContactRoleResponse>(`${this.base}/${publicId}/contacts/${contactPublicId}/primary`, {});
  }
}
