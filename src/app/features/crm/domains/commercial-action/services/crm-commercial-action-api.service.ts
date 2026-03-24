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

@Injectable({ providedIn: 'root' })
export class CrmCommercialActionApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/commercial-actions';

  getByPublicId(publicId: string): Observable<CommercialActionResponse> {
    return this.http.get<CommercialActionResponse>(`${this.base}/${publicId}`);
  }

  getMyActions(status?: CommercialActionStatus): Observable<CommercialActionResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<CommercialActionResponse[]>(`${this.base}/my`, { params });
  }

  getByDeal(dealPublicId: string): Observable<CommercialActionResponse[]> {
    return this.http.get<CommercialActionResponse[]>(`${this.base}/deal/${dealPublicId}`);
  }

  getByContact(contactPublicId: string): Observable<CommercialActionResponse[]> {
    return this.http.get<CommercialActionResponse[]>(`${this.base}/contact/${contactPublicId}`);
  }

  getByLead(leadPublicId: string): Observable<CommercialActionResponse[]> {
    return this.http.get<CommercialActionResponse[]>(`${this.base}/lead/${leadPublicId}`);
  }

  create(body: CreateCommercialActionRequest): Observable<CommercialActionResponse> {
    return this.http.post<CommercialActionResponse>(this.base, body);
  }

  update(publicId: string, body: UpdateCommercialActionRequest): Observable<CommercialActionResponse> {
    return this.http.patch<CommercialActionResponse>(`${this.base}/${publicId}`, body);
  }

  complete(publicId: string, body?: CompleteCommercialActionRequest): Observable<CommercialActionResponse> {
    return this.http.patch<CommercialActionResponse>(`${this.base}/${publicId}/complete`, body ?? {});
  }

  cancel(publicId: string): Observable<CommercialActionResponse> {
    return this.http.patch<CommercialActionResponse>(`${this.base}/${publicId}/cancel`, {});
  }

  reassign(publicId: string, body: ReassignCommercialActionRequest): Observable<CommercialActionResponse> {
    return this.http.patch<CommercialActionResponse>(`${this.base}/${publicId}/assign`, body);
  }
}
