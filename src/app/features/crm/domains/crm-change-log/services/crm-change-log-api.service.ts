import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrmChangeLogEntry, CrmEntityType } from '../models/crm-change-log.model';
import { Page } from '../../../shared/models/page.model';

/**
 * API service for the CRM change log domain.
 *
 * Provides read-only access to the field change audit trail for CRM entities.
 * All write operations are internal to the backend.
 */
@Injectable({ providedIn: 'root' })
export class CrmChangeLogApiService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/crm/changelog';

  /**
   * Returns a paginated list of field change entries for a specific CRM entity.
   *
   * @param entityType  the CRM entity type (CONTACT or DEAL)
   * @param publicId    the public identifier of the target entity
   * @param page        zero-based page index
   * @param size        number of entries per page
   * @param from        optional lower bound on changedAt (ISO-8601)
   * @param to          optional upper bound on changedAt (ISO-8601)
   */
  getChanges(
    entityType: CrmEntityType,
    publicId: string,
    page: number,
    size: number,
    from?: string,
    to?: string
  ): Observable<Page<CrmChangeLogEntry>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'changedAt,desc');

    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);

    return this.http.get<Page<CrmChangeLogEntry>>(
      `${this.base}/${entityType}/${publicId}`,
      { params }
    );
  }

  /**
   * Returns the most recent field change entries across all CRM entities.
   * Intended for dashboard widgets and the global audit log page.
   *
   * @param page zero-based page index
   * @param size number of entries per page
   */
  getRecent(page: number, size: number): Observable<Page<CrmChangeLogEntry>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'changedAt,desc');

    return this.http.get<Page<CrmChangeLogEntry>>(`${this.base}/recent`, { params });
  }
}
