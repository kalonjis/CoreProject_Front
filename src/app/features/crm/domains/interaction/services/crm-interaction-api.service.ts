import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  InteractionResponse,
  LogInteractionRequest,
  UpdateInteractionRequest
} from '../models/interaction.model';

/**
 * HTTP client service for the CRM interactions API.
 * Wraps all endpoints under {@code /api/crm/interactions} for logging, updating, and deleting interactions.
 */
@Injectable({ providedIn: 'root' })
export class CrmInteractionApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/interactions';

  /** Fetches the full detail of an interaction by its public identifier. */
  getByPublicId(publicId: string): Observable<InteractionResponse> {
    return this.http.get<InteractionResponse>(`${this.base}/${publicId}`);
  }

  /** Logs a new CRM interaction. */
  log(body: LogInteractionRequest): Observable<InteractionResponse> {
    return this.http.post<InteractionResponse>(this.base, body);
  }

  /** Partially updates a logged interaction's metadata. */
  update(publicId: string, body: UpdateInteractionRequest): Observable<InteractionResponse> {
    return this.http.patch<InteractionResponse>(`${this.base}/${publicId}`, body);
  }

  /** Deletes a logged interaction. */
  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${publicId}`);
  }
}
