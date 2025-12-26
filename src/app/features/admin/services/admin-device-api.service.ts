import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device } from '../../../data/models/device/device';

/**
 * API service for admin device management operations.
 * Handles all HTTP calls related to device queries and management.
 *
 * Endpoints:
 * - Device queries: /api/admin/device/*
 */
@Injectable({
  providedIn: 'root'
})
export class AdminDeviceApiService {
  private http = inject(HttpClient);

  // =========================================================================
  // DEVICE QUERIES
  // =========================================================================

  /**
   * Retrieves all devices for a specific user.
   *
   * @param userId User ID
   * @returns Observable of device array
   */
  getUserDevices(userId: number): Observable<Device[]> {
    return this.http.get<Device[]>(`/api/admin/device/list/user/${userId}`);
  }

  /**
   * Retrieves details of a specific device by public ID.
   *
   * @param devicePublicId Device public ID
   * @returns Observable of device
   */
  getDeviceById(devicePublicId: string): Observable<Device> {
    return this.http.get<Device>(`/api/admin/device/${devicePublicId}`);
  }

  // =========================================================================
  // DEVICE MANAGEMENT
  // =========================================================================

  /**
   * Updates device trust level.
   *
   * @param devicePublicId Device public ID
   * @param trustLevel New trust level
   * @returns Observable of void
   */
  updateDeviceTrustLevel(devicePublicId: string, trustLevel: any): Observable<void> {
    return this.http.patch<void>(`/api/admin/device/${devicePublicId}/trust-level`, { trustLevel });
  }

  /**
   * Blacklists a device.
   *
   * @param devicePublicId Device public ID
   * @returns Observable of void
   */
  blacklistDevice(devicePublicId: string): Observable<void> {
    return this.http.post<void>(`/api/admin/device/${devicePublicId}/blacklist`, {});
  }

  /**
   * Removes a device from blacklist.
   *
   * @param devicePublicId Device public ID
   * @returns Observable of void
   */
  removeFromBlacklist(devicePublicId: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/device/${devicePublicId}/blacklist`);
  }

  /**
   * Disconnects a specific device.
   *
   * @param devicePublicId Device public ID
   * @returns Observable of void
   */
  disconnectDevice(devicePublicId: string): Observable<void> {
    return this.http.post<void>(`/api/admin/device/${devicePublicId}/disconnect`, {});
  }

  /**
   * Disconnects all devices for a specific user.
   *
   * @param userId User ID
   * @returns Observable of void
   */
  disconnectAllUserDevices(userId: number): Observable<void> {
    return this.http.post<void>(`/api/admin/device/user/${userId}/disconnect-all`, {});
  }
}
