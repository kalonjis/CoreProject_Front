// src/app/features/contact/services/support-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PublicSupportResponse, SubmitPublicSupportRequest } from '../models/support.model';

@Injectable({
  providedIn: 'root'
})
export class SupportApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/public/support';

  submitPublic(request: SubmitPublicSupportRequest): Observable<PublicSupportResponse> {
    return this.http.post<PublicSupportResponse>(this.baseUrl, request);
  }
}
