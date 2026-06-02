import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminUserTelephonyStatus,
  AdminSaveSipConfigRequest,
} from '../models/admin-telephony.model';

@Injectable({ providedIn: 'root' })
export class AdminTelephonyApiService {

  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/admin/telephony/users';

  getStatus(userPublicId: string): Observable<AdminUserTelephonyStatus> {
    return this.http.get<AdminUserTelephonyStatus>(`${this.BASE}/${userPublicId}`);
  }

  createSipConfig(
    userPublicId: string,
    request: AdminSaveSipConfigRequest
  ): Observable<AdminUserTelephonyStatus> {
    return this.http.post<AdminUserTelephonyStatus>(
      `${this.BASE}/${userPublicId}/sip`,
      request
    );
  }

  updateSipConfig(
    userPublicId: string,
    request: AdminSaveSipConfigRequest
  ): Observable<AdminUserTelephonyStatus> {
    return this.http.put<AdminUserTelephonyStatus>(
      `${this.BASE}/${userPublicId}/sip`,
      request
    );
  }

  deleteSipConfig(userPublicId: string): Observable<AdminUserTelephonyStatus> {
    return this.http.delete<AdminUserTelephonyStatus>(
      `${this.BASE}/${userPublicId}/sip`
    );
  }
}
