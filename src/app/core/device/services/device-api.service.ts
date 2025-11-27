import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpUtilService } from '../../../core/http/http-util.service';
import { DeviceSession } from '../models/device-session.model';
import { Device } from '../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';

/** Response for device operations */
export interface DeviceOperationResponse {
  message: string;
  operation: string;
  data?: unknown;
}

/**
 * DeviceApiService - HTTP calls for device management.
 *
 * Responsibilities:
 * - Make HTTP requests to device endpoints
 * - Return typed Observables
 *
 * Does NOT handle:
 * - State management (see DeviceStore)
 * - Side effects (see AuthFacade for orchestration)
 */
@Injectable({ providedIn: 'root' })
export class DeviceApiService {

  private readonly http = inject(HttpUtilService);
  private readonly baseUrl = '/api/device';

  // =========================================================================
  // CURRENT DEVICE
  // =========================================================================

  /** Get current device session (lightweight) */
  getSession(): Observable<DeviceSession> {
    return this.http.get(`${this.baseUrl}/session`);
  }

  /** Get current device full info */
  getCurrent(): Observable<Device> {
    return this.http.get(`${this.baseUrl}/current`);
  }

  // =========================================================================
  // DEVICE LIST
  // =========================================================================

  /** Get all user's devices */
  getMyDevices(): Observable<Device[]> {
    return this.http.get(`${this.baseUrl}/my-devices`);
  }

  /** Get specific device by ID */
  getDevice(deviceId: number): Observable<Device> {
    return this.http.get(`${this.baseUrl}/${deviceId}`);
  }

  // =========================================================================
  // DEVICE CONFIRMATION
  // =========================================================================

  /** Confirm device with token (from email link) */
  confirmDevice(token: string): Observable<DeviceOperationResponse> {
    return this.http.get(`${this.baseUrl}/confirm?token=${token}`);
  }

  /** Reject device with token (from email link) */
  rejectDevice(token: string): Observable<DeviceOperationResponse> {
    return this.http.get(`${this.baseUrl}/reject?token=${token}`);
  }

  /** Request new confirmation link for current device */
  requestConfirmationLink(): Observable<DeviceOperationResponse> {
    return this.http.post(`${this.baseUrl}/request-confirmation`, {});
  }

  // =========================================================================
  // DEVICE MANAGEMENT
  // =========================================================================

  /** Update device trust level */
  updateTrustLevel(deviceId: number, level: DeviceTrustLevel): Observable<DeviceOperationResponse> {
    return this.http.put(`${this.baseUrl}/${deviceId}/trust-level`, { level });
  }

  /** Disconnect a specific device */
  disconnectDevice(deviceId: number): Observable<DeviceOperationResponse> {
    return this.http.post(`${this.baseUrl}/${deviceId}/disconnect`, {});
  }

  /** Disconnect all other devices */
  disconnectAllOthers(): Observable<DeviceOperationResponse> {
    return this.http.post(`${this.baseUrl}/disconnect-all-others`, {});
  }
}
