import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpUtilService } from '../../http/http-util.service';
import {
  CallerInfoResponse,
  CallSessionResponse,
  InitiateCallRequest,
  TerminateCallRequest
} from '../models/call-session.model';
import { SipConnectionDetails } from '../models/sip-connection.model';
import { TwilioTokenResponse } from '../models/twilio-token.model';

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

  /**
   * Records the moment the remote party answered (SIP 200 OK).
   * Sets answeredAt server-side and transitions session to ACTIVE.
   */
  answer(publicId: string): Observable<CallSessionResponse> {
    return this.http.patch<CallSessionResponse>(`${this.base}/${publicId}/answer`, {});
  }

  /** Terminates an active call session. Returns 200 with the updated session. */
  terminate(publicId: string, body: TerminateCallRequest): Observable<CallSessionResponse> {
    return this.http.patch<CallSessionResponse>(`${this.base}/${publicId}/terminate`, body);
  }

  /**
   * Returns the Asterisk WebSocket URL and personal SIP credentials for SIP.js.
   * Returns 404 if no SIP config is assigned to the current user.
   */
  getSipConnectionDetails(): Observable<SipConnectionDetails> {
    return this.http.get<SipConnectionDetails>('/api/crm/telephony/sip/connection');
  }

  /**
   * Returns a short-lived Twilio Access Token for the frontend Device.
   * Returns 404 if the active provider is not Twilio.
   */
  getTwilioToken(): Observable<TwilioTokenResponse> {
    return this.http.get<TwilioTokenResponse>('/api/crm/telephony/twilio/token');
  }

  /**
   * Returns the effective telephony provider for the authenticated user.
   * One of: SIP | TWILIO | TEL_URI
   * The frontend uses this to initialize only the appropriate SDK.
   */
  getMyProvider(): Observable<{ provider: string }> {
    return this.http.get<{ provider: string }>('/api/crm/telephony/my-provider');
  }

  /**
   * Resolves the display name and CRM identity of an inbound caller.
   * Checks SIP extensions first, then CRM contacts by phone number.
   */
  getCallerInfo(number: string): Observable<CallerInfoResponse> {
    return this.http.get<CallerInfoResponse>(`${this.base}/caller-info?number=${encodeURIComponent(number)}`);
  }
}
