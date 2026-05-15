import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpUtilService } from '../../http/http-util.service';
import {
  CallSessionResponse,
  InitiateCallRequest,
  TerminateCallRequest
} from '../models/call-session.model';

/**
 * HTTP client for the CRM call session API.
 * All state management lives in {@link CallStore} / {@link CallFacade}.
 */
@Injectable({ providedIn: 'root' })
export class CallApiService {

  private readonly http = inject(HttpUtilService);
  private readonly base = '/api/crm/calls';

  /** Fetches a call session by public ID. */
  getByPublicId(publicId: string): Observable<CallSessionResponse> {
    return this.http.get<CallSessionResponse>(`${this.base}/${publicId}`);
  }

  /** Initiates a new outbound call session. Returns 201 with the created session. */
  initiate(body: InitiateCallRequest): Observable<CallSessionResponse> {
    return this.http.post<CallSessionResponse>(this.base, body);
  }

  /** Terminates an active call session. Returns 200 with the updated session. */
  terminate(publicId: string, body: TerminateCallRequest): Observable<CallSessionResponse> {
    return this.http.patch<CallSessionResponse>(`${this.base}/${publicId}/terminate`, body);
  }
}
