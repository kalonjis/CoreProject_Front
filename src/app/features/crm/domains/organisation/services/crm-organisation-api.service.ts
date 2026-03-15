import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  OrganisationDetail,
  OrganisationSummary,
  OrganisationFilter,
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  MergeOrganisationRequest
} from '../models/organisation.model';
import { Page } from '../../../shared/models/page.model';

@Injectable({ providedIn: 'root' })
export class CrmOrganisationApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/organisations';

  findAll(filter: OrganisationFilter, page: number): Observable<Page<OrganisationSummary>> {
    // Note: do NOT send 'size' as a pagination param — it conflicts with the
    // OrganisationListFilterRequest.size field (OrganisationSize enum) on the backend.
    // The backend default is 20 (matching our pageSize constant).
    let params = new HttpParams()
      .set('page', page)
      .set('sort', 'name,asc');

    if (filter.keyword?.trim())  params = params.set('keyword', filter.keyword.trim());
    if (filter.industry?.trim()) params = params.set('industry', filter.industry.trim());
    if (filter.size)             params = params.set('size', filter.size);
    if (filter.countryCode)      params = params.set('countryCode', filter.countryCode);

    return this.http.get<Page<OrganisationSummary>>(this.base, { params });
  }

  getByPublicId(publicId: string): Observable<OrganisationDetail> {
    return this.http.get<OrganisationDetail>(`${this.base}/${publicId}`);
  }

  create(body: CreateOrganisationRequest): Observable<OrganisationDetail> {
    return this.http.post<OrganisationDetail>(this.base, body);
  }

  update(publicId: string, body: UpdateOrganisationRequest): Observable<OrganisationDetail> {
    return this.http.patch<OrganisationDetail>(`${this.base}/${publicId}`, body);
  }

  merge(body: MergeOrganisationRequest): Observable<OrganisationDetail> {
    return this.http.post<OrganisationDetail>(`${this.base}/merge`, body);
  }
}
