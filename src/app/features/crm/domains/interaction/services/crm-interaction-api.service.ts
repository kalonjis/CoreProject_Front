import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  InteractionResponse,
  LogInteractionRequest,
  UpdateInteractionRequest
} from '../models/interaction.model';

@Injectable({ providedIn: 'root' })
export class CrmInteractionApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/interactions';

  getByPublicId(publicId: string): Observable<InteractionResponse> {
    return this.http.get<InteractionResponse>(`${this.base}/${publicId}`);
  }

  log(body: LogInteractionRequest): Observable<InteractionResponse> {
    return this.http.post<InteractionResponse>(this.base, body);
  }

  update(publicId: string, body: UpdateInteractionRequest): Observable<InteractionResponse> {
    return this.http.patch<InteractionResponse>(`${this.base}/${publicId}`, body);
  }

  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${publicId}`);
  }
}
