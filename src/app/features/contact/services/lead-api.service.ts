// src/app/features/contact/services/lead-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SubmitLeadRequest, LeadResponse } from '../models/lead.model';

@Injectable({
  providedIn: 'root'
})
export class LeadApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/lead';

  /**
   * Submit a public inquiry.
   */
  submit(request: SubmitLeadRequest): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(this.baseUrl, request);
  }
}
