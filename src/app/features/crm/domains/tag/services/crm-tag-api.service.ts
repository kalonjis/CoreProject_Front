import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag, CreateTagRequest, UpdateTagRequest } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class CrmTagApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/tags';

  findAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.base);
  }

  create(request: CreateTagRequest): Observable<Tag> {
    return this.http.post<Tag>(this.base, request);
  }

  update(publicId: string, request: UpdateTagRequest): Observable<Tag> {
    return this.http.patch<Tag>(`${this.base}/${publicId}`, request);
  }

  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${publicId}`);
  }

  addToContact(tagPublicId: string, contactPublicId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${tagPublicId}/contacts/${contactPublicId}`, {});
  }

  removeFromContact(tagPublicId: string, contactPublicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${tagPublicId}/contacts/${contactPublicId}`);
  }

  addToDeal(tagPublicId: string, dealPublicId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${tagPublicId}/deals/${dealPublicId}`, {});
  }

  removeFromDeal(tagPublicId: string, dealPublicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${tagPublicId}/deals/${dealPublicId}`);
  }

  addToOrganisation(tagPublicId: string, organisationPublicId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${tagPublicId}/organisations/${organisationPublicId}`, {});
  }

  removeFromOrganisation(tagPublicId: string, organisationPublicId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${tagPublicId}/organisations/${organisationPublicId}`);
  }
}
