/**
 * HTTP client for the CRM Timeline API ({@code /api/crm/timeline}).
 *
 * Returns unified timeline entries for a deal, contact, or lead.
 * Each entry is either an Interaction or a completed CommercialAction,
 * projected into a single {@link TimelineEntryResponse}.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimelineEntryResponse } from '../models/timeline.model';

@Injectable({ providedIn: 'root' })
export class CrmTimelineApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/timeline';

  /** Returns the unified activity timeline (interactions + completed actions) for a deal. */
  getTimelineByDeal(dealPublicId: string): Observable<TimelineEntryResponse[]> {
    return this.http.get<TimelineEntryResponse[]>(`${this.base}/deal/${dealPublicId}`);
  }

  /** Returns the unified activity timeline (interactions + completed actions) for a contact. */
  getTimelineByContact(contactPublicId: string): Observable<TimelineEntryResponse[]> {
    return this.http.get<TimelineEntryResponse[]>(`${this.base}/contact/${contactPublicId}`);
  }

  /** Returns the unified activity timeline (interactions + completed actions) for a lead. */
  getTimelineByLead(leadPublicId: string): Observable<TimelineEntryResponse[]> {
    return this.http.get<TimelineEntryResponse[]>(`${this.base}/lead/${leadPublicId}`);
  }

  /** Returns the aggregated activity timeline across all contacts of an organisation. */
  getTimelineByOrganisation(organisationPublicId: string): Observable<TimelineEntryResponse[]> {
    return this.http.get<TimelineEntryResponse[]>(`${this.base}/organisation/${organisationPublicId}`);
  }
}
