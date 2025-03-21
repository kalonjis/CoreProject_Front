import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Device} from '../models/device/device';
import {Observable} from 'rxjs';
import {DeviceTrustLevel} from '../models/device/device-trust-level';
import {DeviceTrustLevelForm} from '../models/device/device-trust-level-form';
import {ApiResponse} from '../models/auth/api-response';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private http = inject(HttpClient);

  /**
   * Get current device information
   */
  getCurrentDevice(): Observable<Device> {
    return this.http.get<Device>('/api/device/current');
  }

  /**
   * Get specific device by ID
   */
  getDevice(deviceId: number): Observable<Device> {
    return this.http.get<Device>(`/api/device/${deviceId}`);
  }

  /**
   * Get list of user's devices
   */
  getMyDevices(): Observable<Device[]> {
    return this.http.get<Device[]>('/api/device/my-list');
  }

  /**
   * Update device trust level
   */
  updateTrustLevel(deviceId: number, trustLevel: DeviceTrustLevel): Observable<void> {
    const form: DeviceTrustLevelForm = {
      deviceTrustLevel: trustLevel
    };
    return this.http.patch<void>(`/api/device/update-trust-level/${deviceId}`, form);
  }

  /**
   * Confirm device with token
   */
  confirmDevice(token: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`/api/device/confirm?token=${token}`, {});
  }

  /**
   * Reject device with token
   */
  rejectDevice(token: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`/api/device/reject?token=${token}`, {});
  }
}
