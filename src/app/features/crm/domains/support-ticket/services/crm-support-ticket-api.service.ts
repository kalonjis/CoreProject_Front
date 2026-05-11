/**
 * HTTP client for the CRM Support Ticket API ({@code /api/crm/support-tickets}).
 *
 * Covers paginated listing with filters, detail retrieval, creation, update,
 * status transitions, assignment, and deletion.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SupportTicketSummary,
  SupportTicketDetail,
  SupportTicketFilter,
  CreateSupportTicketRequest,
  UpdateSupportTicketRequest,
  ChangeSupportTicketStatusRequest,
  AssignSupportTicketRequest
} from '../models/support-ticket.model';
import { Page } from '../../../shared/models/page.model';

@Injectable({ providedIn: 'root' })
export class CrmSupportTicketApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/support-tickets';

  /** Returns a paginated list of support tickets filtered by the given criteria. */
  findAll(filter: SupportTicketFilter, page: number, size: number): Observable<Page<SupportTicketSummary>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    if (filter.keyword?.trim())          params = params.set('keyword', filter.keyword.trim());
    if (filter.status)                   params = params.set('status', filter.status);
    if (filter.source)                   params = params.set('source', filter.source);
    if (filter.contactPublicId)          params = params.set('contactPublicId', filter.contactPublicId);
    if (filter.assignedToPublicId)       params = params.set('assignedToPublicId', filter.assignedToPublicId);
    if (filter.unassignedOnly)           params = params.set('unassignedOnly', 'true');
    if (filter.organisationPublicId)     params = params.set('organisationPublicId', filter.organisationPublicId);

    return this.http.get<Page<SupportTicketSummary>>(this.base, { params });
  }

  /** Returns the full detail of a single support ticket by its public UUID. */
  getByPublicId(publicId: string): Observable<SupportTicketDetail> {
    return this.http.get<SupportTicketDetail>(`${this.base}/${publicId}`);
  }

  /** Creates a new support ticket. */
  create(body: CreateSupportTicketRequest): Observable<SupportTicketDetail> {
    return this.http.post<SupportTicketDetail>(this.base, body);
  }

  /** Partially updates a support ticket's subject and description. */
  update(publicId: string, body: UpdateSupportTicketRequest): Observable<SupportTicketDetail> {
    return this.http.patch<SupportTicketDetail>(`${this.base}/${publicId}`, body);
  }

  /** Transitions a support ticket to a new lifecycle status. */
  changeStatus(publicId: string, body: ChangeSupportTicketStatusRequest): Observable<SupportTicketDetail> {
    return this.http.patch<SupportTicketDetail>(`${this.base}/${publicId}/status`, body);
  }

  /** Assigns a support ticket to a commercial. */
  assign(publicId: string, body: AssignSupportTicketRequest): Observable<SupportTicketDetail> {
    return this.http.patch<SupportTicketDetail>(`${this.base}/${publicId}/assign`, body);
  }

  /** Permanently deletes a support ticket (admin only). */
  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${publicId}`);
  }
}
