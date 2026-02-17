// src/app/features/notification/services/notification-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {map, Observable} from 'rxjs';

import {
  Notification,
  NotificationPageResponse,
  UnreadCountResponse,
  NotificationOperationResponse,
  NotificationQueryParams
} from '../models/notification.model';
import {
  NotificationPreference,
  UpdatePreferenceRequest,
  SetQuietHoursRequest,
  BulkPreferenceUpdateRequest,
  PreferenceOperationResponse, PreferenceMatrixResponse, QuietHoursResponse
} from '../models/notification-preference.model';
import { NotificationChannel } from '../models/notification.enums';

/**
 * NotificationApiService - HTTP client for notification endpoints.
 *
 * Handles all REST API calls to /api/notifications.
 * Does NOT manage state - that's the store's job.
 */
@Injectable({ providedIn: 'root' })
export class NotificationApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/notifications';
  private readonly preferencesUrl = '/api/notifications/preferences';

  // ===========================================================================
  // NOTIFICATIONS - Read Operations
  // ===========================================================================

  /**
   * Gets paginated notifications for current user.
   */
  getNotifications(params?: NotificationQueryParams): Observable<NotificationPageResponse> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.unreadOnly) {
      httpParams = httpParams.set('unreadOnly', 'true');
    }
    if (params?.type) {
      httpParams = httpParams.set('type', params.type);
    }

    return this.http.get<NotificationPageResponse>(this.baseUrl, { params: httpParams });
  }

  /**
   * Gets a single notification by ID.
   */
  getNotification(publicId: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.baseUrl}/${publicId}`);
  }

  /**
   * Gets unread notification count.
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.baseUrl}/unread/count`);
  }

  /**
   * Gets recent notifications (for dropdown preview).
   * Uses the main paginated endpoint with size limit.
   */
  getRecent(limit: number = 10): Observable<Notification[]> {
    const params = new HttpParams()
      .set('size', limit.toString())
      .set('page', '0');

    return this.http.get<NotificationPageResponse>(this.baseUrl, { params })
      .pipe(
        map(response => response.content)
      );
  }

  /**
   * Gets active (non-dismissed, non-expired) notifications.
   */
  getActiveNotifications(params?: NotificationQueryParams): Observable<NotificationPageResponse> {
    let httpParams = new HttpParams();

    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<NotificationPageResponse>(
      `${this.baseUrl}/active`,
      { params: httpParams }
    );
  }

  /**
   * Gets all unread notifications.
   */
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/unread`);
  }



  // ===========================================================================
  // NOTIFICATIONS - Actions
  // ===========================================================================

  /**
   * Marks a notification as read.
   */
  markAsRead(publicId: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/${publicId}/read`, {});
  }

  /**
   * Marks multiple notifications as read.
   */
  markMultipleAsRead(publicIds: string[]): Observable<NotificationOperationResponse> {
    return this.http.post<NotificationOperationResponse>(
      `${this.baseUrl}/read`,
      { publicIds }
    );
  }

  /**
   * Marks all notifications as read.
   */
  markAllAsRead(): Observable<NotificationOperationResponse> {
    return this.http.post<NotificationOperationResponse>(
      `${this.baseUrl}/read-all`,
      {}
    );
  }

  /**
   * Dismisses a notification.
   */
  dismiss(publicId: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/${publicId}/dismiss`, {});
  }

  /**
   * Dismisses all notifications.
   */
  dismissAll(): Observable<NotificationOperationResponse> {
    return this.http.post<NotificationOperationResponse>(
      `${this.baseUrl}/dismiss-all`,
      {}
    );
  }

  /**
   * Deletes a notification.
   */
  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${publicId}`);
  }

  /**
   * Deletes multiple notifications.
   */
  deleteMultiple(publicIds: string[]): Observable<NotificationOperationResponse> {
    return this.http.post<NotificationOperationResponse>(
      `${this.baseUrl}/delete`,
      { publicIds }
    );
  }

  // ===========================================================================
  // PREFERENCES - Read Operations
  // ===========================================================================

  /**
   * Gets all user preferences.
   */
  getPreferences(): Observable<NotificationPreference[]> {
    return this.http.get<NotificationPreference[]>(this.preferencesUrl);
  }

  /**
   * Gets the complete preference matrix (all types × all channels).
   */
  getPreferenceMatrix(): Observable<PreferenceMatrixResponse> {
    return this.http.get<PreferenceMatrixResponse>(`${this.preferencesUrl}/matrix`);
  }

  /**
   * Gets preferences for a specific channel.
   */
  getPreferencesByChannel(channel: NotificationChannel): Observable<NotificationPreference[]> {
    return this.http.get<NotificationPreference[]>(
      `${this.preferencesUrl}/channel/${channel}`
    );
  }

  /**
   * Gets quiet hours configuration for a channel.
   */
  getQuietHours(channel: NotificationChannel): Observable<QuietHoursResponse> {
    return this.http.get<QuietHoursResponse>(
      `${this.preferencesUrl}/quiet-hours/${channel}`
    );
  }

  // ===========================================================================
  // PREFERENCES - Update Operations
  // ===========================================================================

  /**
   * Updates a single preference.
   */
  updatePreference(request: UpdatePreferenceRequest): Observable<NotificationPreference> {
    return this.http.put<NotificationPreference>(this.preferencesUrl, request);
  }

  /**
   * Updates multiple preferences at once.
   */
  updatePreferences(request: BulkPreferenceUpdateRequest): Observable<PreferenceOperationResponse> {
    return this.http.put<PreferenceOperationResponse>(
      `${this.preferencesUrl}/bulk`,
      request
    );
  }

  /**
   * Sets quiet hours for a channel.
   */
  setQuietHours(request: SetQuietHoursRequest): Observable<PreferenceOperationResponse> {
    return this.http.put<PreferenceOperationResponse>(
      `${this.preferencesUrl}/quiet-hours`,
      request
    );
  }

  /**
   * Clears quiet hours for a channel.
   */
  clearQuietHours(channel: NotificationChannel): Observable<PreferenceOperationResponse> {
    return this.http.delete<PreferenceOperationResponse>(
      `${this.preferencesUrl}/quiet-hours/${channel}`
    );
  }

  /**
   * Enables all channels for a notification type.
   */
  enableAllChannels(type: string): Observable<PreferenceOperationResponse> {
    return this.http.post<PreferenceOperationResponse>(
      `${this.preferencesUrl}/type/${type}/enable-all`,
      {}
    );
  }

  /**
   * Disables all channels for a notification type (mute).
   */
  disableAllChannels(type: string): Observable<PreferenceOperationResponse> {
    return this.http.post<PreferenceOperationResponse>(
      `${this.preferencesUrl}/type/${type}/disable-all`,
      {}
    );
  }

  /**
   * Resets all preferences to defaults.
   */
  resetToDefaults(): Observable<PreferenceOperationResponse> {
    return this.http.post<PreferenceOperationResponse>(
      `${this.preferencesUrl}/reset`,
      {}
    );
  }
}
