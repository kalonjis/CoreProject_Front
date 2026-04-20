import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CommercialActionResponse,
  CommercialActionStatus,
  CompleteCommercialActionRequest,
  CreateCommercialActionRequest,
  UpdateCommercialActionRequest,
  ReassignCommercialActionRequest
} from '../models/commercial-action.model';

/**
 * HTTP client service for the CRM commercial actions API.
 * Wraps all endpoints under {@code /api/crm/commercial-actions}.
 */
@Injectable({ providedIn: 'root' })
export class CrmCommercialActionApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/commercial-actions';

  /** Fetches a single commercial action by its public identifier. */
  getByPublicId(publicId: string): Observable<CommercialActionResponse> {
    return this.http.get<CommercialActionResponse>(`${this.base}/${publicId}`);
  }

  /** Returns all commercial actions assigned to the current user, optionally filtered by status. */
  getMyActions(status?: CommercialActionStatus): Observable<CommercialActionResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<CommercialActionResponse[]>(`${this.base}/my`, { params });
  }

  /** Returns all commercial actions linked to a deal. */
  getByDeal(dealPublicId: string): Observable<CommercialActionResponse[]> {
    return this.http.get<CommercialActionResponse[]>(`${this.base}/deal/${dealPublicId}`);
  }

  /** Returns all commercial actions linked to a contact. */
  getByContact(contactPublicId: string): Observable<CommercialActionResponse[]> {
    return this.http.get<CommercialActionResponse[]>(`${this.base}/contact/${contactPublicId}`);
  }

  /** Returns all commercial actions linked to a lead. */
  getByLead(leadPublicId: string): Observable<CommercialActionResponse[]> {
    return this.http.get<CommercialActionResponse[]>(`${this.base}/lead/${leadPublicId}`);
  }

  /** Creates a new commercial action. */
  create(body: CreateCommercialActionRequest): Observable<CommercialActionResponse> {
    return this.http.post<CommercialActionResponse>(this.base, body);
  }

  /** Partially updates a commercial action. */
  update(publicId: string, body: UpdateCommercialActionRequest): Observable<CommercialActionResponse> {
    return this.http.patch<CommercialActionResponse>(`${this.base}/${publicId}`, body);
  }

  /** Marks a commercial action as completed with optional type-specific details. */
  complete(publicId: string, body?: CompleteCommercialActionRequest): Observable<CommercialActionResponse> {
    return this.http.patch<CommercialActionResponse>(`${this.base}/${publicId}/complete`, body ?? {});
  }

  /** Cancels a commercial action. */
  cancel(publicId: string): Observable<CommercialActionResponse> {
    return this.http.patch<CommercialActionResponse>(`${this.base}/${publicId}/cancel`, {});
  }

  /** Reassigns a commercial action to another user. */
  reassign(publicId: string, body: ReassignCommercialActionRequest): Observable<CommercialActionResponse> {
    return this.http.patch<CommercialActionResponse>(`${this.base}/${publicId}/assign`, body);
  }
}
