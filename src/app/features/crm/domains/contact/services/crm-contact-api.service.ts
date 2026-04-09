import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ContactDetail,
  ContactSummary,
  ContactFilter,
  CreateContactRequest,
  UpdateContactRequest,
  UpdateContactStatusRequest,
  AssignContactRequest,
  LinkContactOrganisationRequest,
  MergeContactRequest
} from '../models/contact.model';
import { DealSummary } from '../../deal/models/deal.model';
import { Page } from '../../../shared/models/page.model';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CrmContactApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/contacts';

  findAll(
    filter: ContactFilter,
    page: number,
    size: number,
    sort = 'lastName',
    direction: 'asc' | 'desc' = 'asc'
  ): Observable<Page<ContactSummary>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', `${sort},${direction}`);

    if (filter.keyword?.trim())         params = params.set('keyword', filter.keyword.trim());
    if (filter.status)                  params = params.set('status', filter.status);
    if (filter.organisationPublicId)    params = params.set('organisationPublicId', filter.organisationPublicId);
    if (filter.withoutOrganisation)     params = params.set('withoutOrganisation', 'true');
    if (filter.assignedToPublicId)      params = params.set('assignedToPublicId', filter.assignedToPublicId);
    if (filter.hasLinkedUser != null)     params = params.set('hasLinkedUser', String(filter.hasLinkedUser));
    if (filter.convertedFromLead != null) params = params.set('convertedFromLead', String(filter.convertedFromLead));
    if (filter.tagPublicId)               params = params.set('tagPublicId', filter.tagPublicId);

    return this.http.get<Page<ContactSummary>>(this.base, { params });
  }

  getByPublicId(publicId: string): Observable<ContactDetail> {
    return this.http.get<ContactDetail>(`${this.base}/${publicId}`);
  }

  create(body: CreateContactRequest): Observable<ContactDetail> {
    return this.http.post<ContactDetail>(this.base, body);
  }

  update(publicId: string, body: UpdateContactRequest): Observable<ContactDetail> {
    return this.http.patch<ContactDetail>(`${this.base}/${publicId}`, body);
  }

  updateStatus(publicId: string, body: UpdateContactStatusRequest): Observable<ContactDetail> {
    return this.http.patch<ContactDetail>(`${this.base}/${publicId}/status`, body);
  }

  assign(publicId: string, body: AssignContactRequest): Observable<ContactDetail> {
    return this.http.patch<ContactDetail>(`${this.base}/${publicId}/assign`, body);
  }

  linkOrganisation(publicId: string, body: LinkContactOrganisationRequest): Observable<ContactDetail> {
    return this.http.patch<ContactDetail>(`${this.base}/${publicId}/organisation`, body);
  }

  merge(body: MergeContactRequest): Observable<ContactDetail> {
    return this.http.post<ContactDetail>(`${this.base}/merge`, body);
  }

  getFromLead(leadPublicId: string): Observable<ContactDetail> {
    return this.http.get<ContactDetail>(`${this.base}/from-lead/${leadPublicId}`);
  }

  findByOrganisation(organisationPublicId: string): Observable<ContactSummary[]> {
    const params = new HttpParams()
      .set('organisationPublicId', organisationPublicId)
      .set('page', 0)
      .set('size', 100)
      .set('sort', 'lastName,asc');
    return this.http.get<Page<ContactSummary>>(this.base, { params }).pipe(map(p => p.content));
  }

  getDeals(publicId: string): Observable<DealSummary[]> {
    return this.http.get<DealSummary[]>(`${this.base}/${publicId}/deals`);
  }

  sendEmail(publicId: string, body: { subject: string; body: string; dealPublicId?: string }): Observable<void> {
    return this.http.post<void>(`${this.base}/${publicId}/email`, body);
  }
}
