import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserStats } from '../models/user-stats.model';
import { DeviceStats } from '../models/device-stats.model';

/**
 * API service for admin statistics operations.
 * Handles HTTP calls to retrieve aggregated statistics for dashboard and containers.
 *
 * Endpoints:
 * - GET /api/admin/users/stats → User statistics
 * - GET /api/admin/device/stats → Device statistics
 */
@Injectable({
  providedIn: 'root'
})
export class AdminStatsApiService {
  private http = inject(HttpClient);

  /**
   * Retrieves comprehensive user statistics.
   *
   * @returns Observable of user statistics including totals, active/inactive counts, verification status, and roles
   */
  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>('/api/admin/users/stats');
  }

  /**
   * Retrieves comprehensive device statistics.
   *
   * @returns Observable of device statistics including totals, trust levels, and activity metrics
   */
  getDeviceStats(): Observable<DeviceStats> {
    return this.http.get<DeviceStats>('/api/admin/device/stats');
  }
}
