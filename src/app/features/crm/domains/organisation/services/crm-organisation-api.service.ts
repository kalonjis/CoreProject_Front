import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  OrganisationDetail,
  OrganisationSummary,
  OrganisationFilter,
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  UpdateOrganisationStatusRequest,
  MergeOrganisationRequest
} from '../models/organisation.model';
import { ContactSummary } from '../../contact/models/contact.model';
import { DealSummary } from '../../deal/models/deal.model';
import { Page } from '../../../shared/models/page.model';

/**
 * HTTP client service for the CRM organisations API.
 * Wraps all endpoints under {@code /api/crm/organisations} including CRUD, status, merge, contacts, and deals.
 */
@Injectable({ providedIn: 'root' })
export class CrmOrganisationApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/organisations';

  /**
   * Returns a paginated, filtered list of organisation summaries.
   * Note: the {@code size} query param is intentionally omitted to avoid collision
   * with the {@code OrganisationSize} filter field on the backend (default page size is 20).
   */
  findAll(
    filter: OrganisationFilter,
    page: number,
    sort = 'name',
    direction: 'asc' | 'desc' = 'asc'
  ): Observable<Page<OrganisationSummary>> {
    // Note: do NOT send 'size' as a pagination param — it conflicts with the
    // OrganisationListFilterRequest.size field (OrganisationSize enum) on the backend.
    // The backend default is 20 (matching our pageSize constant).
    let params = new HttpParams()
      .set('page', page)
      .set('sort', `${sort},${direction}`);

    if (filter.keyword?.trim())  params = params.set('keyword', filter.keyword.trim());
    if (filter.industry?.trim()) params = params.set('industry', filter.industry.trim());
    if (filter.size)             params = params.set('size', filter.size);
    if (filter.status)           params = params.set('status', filter.status);
    if (filter.countryCode)      params = params.set('countryCode', filter.countryCode);
    if (filter.tagPublicId)      params = params.set('tagPublicId', filter.tagPublicId);

    return this.http.get<Page<OrganisationSummary>>(this.base, { params });
  }

  /** Fetches the full detail of an organisation by its public identifier. */
  getByPublicId(publicId: string): Observable<OrganisationDetail> {
    return this.http.get<OrganisationDetail>(`${this.base}/${publicId}`);
  }

  /** Creates a new organisation. */
  create(body: CreateOrganisationRequest): Observable<OrganisationDetail> {
    return this.http.post<OrganisationDetail>(this.base, body);
  }

  /** Partially updates an organisation's profile fields. */
  update(publicId: string, body: UpdateOrganisationRequest): Observable<OrganisationDetail> {
    return this.http.patch<OrganisationDetail>(`${this.base}/${publicId}`, body);
  }

  /** Transitions the lifecycle status of an organisation. */
  updateStatus(publicId: string, body: UpdateOrganisationStatusRequest): Observable<OrganisationDetail> {
    return this.http.patch<OrganisationDetail>(`${this.base}/${publicId}/status`, body);
  }

  /** Merges two organisations: the source is archived and its contacts transferred to the target. */
  merge(body: MergeOrganisationRequest): Observable<OrganisationDetail> {
    return this.http.post<OrganisationDetail>(`${this.base}/merge`, body);
  }

  /** Returns all contacts belonging to an organisation. */
  getContacts(publicId: string): Observable<ContactSummary[]> {
    return this.http.get<ContactSummary[]>(`${this.base}/${publicId}/contacts`);
  }

  /** Returns all deals associated with an organisation. */
  getDeals(publicId: string): Observable<DealSummary[]> {
    return this.http.get<DealSummary[]>(`${this.base}/${publicId}/deals`);
  }
}
