import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag, CreateTagRequest, UpdateTagRequest } from '../models/tag.model';

/**
 * HTTP client service for the CRM tags API.
 * Wraps all endpoints under {@code /api/crm/tags} including CRUD and entity-linking operations.
 */
@Injectable({ providedIn: 'root' })
export class CrmTagApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/tags';

  /** Returns all tags, ordered by name. */
  findAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.base);
  }

  /** Creates a new tag. */
  create(request: CreateTagRequest): Observable<Tag> {
    return this.http.post<Tag>(this.base, request);
  }

  /** Partially updates a tag's name or colour. */
  update(publicId: string, request: UpdateTagRequest): Observable<Tag> {
    return this.http.patch<Tag>(`${this.base}/${publicId}`, request);
  }

  /** Deletes a tag and removes it from all linked entities. */
  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${publicId}`);
  }

  /** Links a tag to a contact. */
  addToContact(tagPublicId: string, contactPublicId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${tagPublicId}/contacts/${contactPublicId}`, {});
  }

  /** Removes a tag from a contact. */
  removeFromContact(tagPublicId: string, contactPublicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${tagPublicId}/contacts/${contactPublicId}`);
  }

  /** Links a tag to a deal. */
  addToDeal(tagPublicId: string, dealPublicId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${tagPublicId}/deals/${dealPublicId}`, {});
  }

  /** Removes a tag from a deal. */
  removeFromDeal(tagPublicId: string, dealPublicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${tagPublicId}/deals/${dealPublicId}`);
  }

  /** Links a tag to an organisation. */
  addToOrganisation(tagPublicId: string, organisationPublicId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${tagPublicId}/organisations/${organisationPublicId}`, {});
  }

  /** Removes a tag from an organisation. */
  removeFromOrganisation(tagPublicId: string, organisationPublicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${tagPublicId}/organisations/${organisationPublicId}`);
  }
}
