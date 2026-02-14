// src/app/features/notification/services/notification.facade.ts

import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {Observable, tap, catchError, throwError, finalize, of, map} from 'rxjs';

import { NotificationStore } from '../state/notification.store';
import { NotificationApiService } from './notification-api.service';
import { NotificationSseService } from './notification-sse.service';

import {
  Notification,
  NotificationPageResponse,
  NotificationQueryParams,
  NotificationFilterState
} from '../models/notification.model';
import {
  NotificationPreference,
  UpdatePreferenceRequest
} from '../models/notification-preference.model';
import { NotificationType, NotificationChannel } from '../models/notification.enums';
import { SseConnectionStatus } from '../models/notification.state';

/**
 * NotificationFacade - Single entry point for notification operations.
 *
 * Responsibilities:
 * - Orchestrate API calls, SSE connection, and store updates
 * - Handle side effects (toasts, loading states)
 * - Expose reactive state for components
 *
 * Components should ONLY interact with this facade, never directly
 * with store, API service, or SSE service.
 */
@Injectable({ providedIn: 'root' })
export class NotificationFacade {

  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(NotificationStore);
  private readonly api = inject(NotificationApiService);
  private readonly sse = inject(NotificationSseService);

  private initialized = false;

  // ===========================================================================
  // EXPOSED STATE (readonly signals from store)
  // ===========================================================================

  // Notifications
  readonly notifications = this.store.filteredNotifications;
  readonly unreadCount = this.store.unreadCount;
  readonly totalCount = this.store.totalCount;
  readonly hasUnread = this.store.hasUnread;
  readonly hasMore = this.store.hasMore;
  readonly filter = this.store.filter;

  // Preferences
  readonly preferences = this.store.preferences;
  readonly preferenceMatrix = this.store.preferenceMatrix;

  // Connection
  readonly sseStatus = this.store.sseStatus;
  readonly isConnected = this.store.isConnected;
  readonly isReconnecting = this.store.isReconnecting;

  // UI State
  readonly isLoading = this.store.isLoading;
  readonly isLoadingPreferences = this.store.isLoadingPreferences;
  readonly isDropdownOpen = this.store.isDropdownOpen;
  readonly error = this.store.error;

  // Toast
  readonly currentToast = this.store.currentToast;
  readonly hasToasts = this.store.hasToasts;

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initializes the notification system.
   * Should be called after user login.
   */
  initialize(): void {
    if (this.initialized) {
      console.warn('[NotificationFacade] Already initialized');
      return;
    }

    console.log('[NotificationFacade] Initializing...');
    this.initialized = true;

    // Subscribe to SSE events
    this.subscribeToSseEvents();

    // Load initial data
    this.loadUnreadCount();
    this.loadRecentNotifications();

    // Connect to SSE
    this.sse.connect();
  }

  /**
   * Shuts down the notification system.
   * Should be called on user logout.
   */
  shutdown(): void {
    console.log('[NotificationFacade] Shutting down...');

    this.sse.disconnect();
    this.store.reset();
    this.initialized = false;
  }

  // ===========================================================================
  // SSE EVENT HANDLING
  // ===========================================================================

  private subscribeToSseEvents(): void {
    // Status changes
    this.sse.statusChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        this.store.setSseStatus(status);

        if (status === SseConnectionStatus.RECONNECTING) {
          this.store.incrementReconnectAttempts();
        } else if (status === SseConnectionStatus.CONNECTED) {
          this.store.resetReconnectAttempts();
          // Refresh data after reconnection
          this.loadUnreadCount();
        }
      });

    // Incoming notifications
    this.sse.notification$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(notification => {
        this.handleIncomingNotification(notification);
      });

    // Errors
    this.sse.error$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => {
        console.error('[NotificationFacade] SSE Error:', error);
        this.store.setError('Connection error. Reconnecting...');
      });
  }

  private handleIncomingNotification(notification: Notification): void {
    console.log('[NotificationFacade] Incoming notification:', notification.publicId);

    // Add to store
    this.store.addNotification(notification);

    // Add to toast queue
    this.store.enqueueToast(notification);

    // Show next toast if none is currently showing
    if (!this.store.currentToast()) {
      this.store.showNextToast();
    }
  }

  // ===========================================================================
  // NOTIFICATIONS - Load Operations
  // ===========================================================================

  /**
   * Loads unread notification count.
   */
  loadUnreadCount(): void {
    console.log('[NotificationFacade] Loading unread count...');

    this.api.getUnreadCount()
      .pipe(
        tap(response => {
          console.log('[NotificationFacade] Unread count response:', response);
          this.store.setUnreadCount(response.count);
          console.log('[NotificationFacade] Store unreadCount set to:', response.count);
        }),
        catchError(error => {
          console.error('[NotificationFacade] Failed to load unread count:', error);
          return of({ count: 0 });
        })
      )
      .subscribe();
  }

  /**
   * Loads recent notifications (for dropdown).
   */
  loadRecentNotifications(limit: number = 10): void {
    this.store.setLoading(true);

    this.api.getRecent(limit)
      .pipe(
        tap(notifications => {
          this.store.setNotifications(notifications);
        }),
        catchError(error => {
          console.error('[NotificationFacade] Failed to load recent:', error);
          this.store.setError('Failed to load notifications');
          return of([]);
        }),
        finalize(() => this.store.setLoading(false))
      )
      .subscribe();
  }

  /**
   * Loads paginated notifications.
   */
  loadNotifications(params?: NotificationQueryParams): Observable<NotificationPageResponse> {
    this.store.setLoading(true);
    this.store.setError(null);

    return this.api.getNotifications(params).pipe(
      tap(response => {
        if (params?.page === 0 || !params?.page) {
          this.store.setNotifications(response.content);
        } else {
          this.store.appendNotifications(response.content);
        }
        this.store.setTotalCount(response.totalElements);
        this.store.setPagination(response.number, !response.last);
      }),
      catchError(error => {
        this.store.setError('Failed to load notifications');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false))
    );
  }

  /**
   * Loads next page of notifications.
   */
  loadMore(): void {
    const currentPage = this.store.state().currentPage;
    this.loadNotifications({ page: currentPage + 1 }).subscribe();
  }

  /**
   * Refreshes notifications (reloads from beginning).
   */
  refresh(): void {
    this.loadNotifications({ page: 0 }).subscribe();
    this.loadUnreadCount();
  }

  // ===========================================================================
  // NOTIFICATIONS - Actions
  // ===========================================================================

  /**
   * Marks a notification as read.
   */
  markAsRead(publicId: string): Observable<Notification> {
    // Optimistic update
    this.store.markAsRead(publicId);

    return this.api.markAsRead(publicId).pipe(
      catchError(error => {
        // Revert on failure - would need to reload
        this.refresh();
        return throwError(() => error);
      })
    );
  }

  /**
   * Marks all notifications as read.
   */
  markAllAsRead(): Observable<void> {
    // Optimistic update
    this.store.markAllAsRead();

    return this.api.markAllAsRead().pipe(
      tap(() => this.store.setUnreadCount(0)),
      map(() => void 0),
      catchError(error => {
        this.refresh();
        return throwError(() => error);
      })
    );
  }

  /**
   * Deletes a notification.
   */
  deleteNotification(publicId: string): Observable<void> {
    // Optimistic update
    this.store.removeNotification(publicId);

    return this.api.delete(publicId).pipe(
      catchError(error => {
        this.refresh();
        return throwError(() => error);
      })
    );
  }

  /**
   * Dismisses a notification.
   */
  dismissNotification(publicId: string): Observable<Notification> {
    return this.api.dismiss(publicId).pipe(
      tap(notification => {
        this.store.updateNotification(publicId, notification);
      })
    );
  }

  // ===========================================================================
  // FILTER
  // ===========================================================================

  /**
   * Sets notification filter.
   */
  setFilter(filter: NotificationFilterState): void {
    this.store.setFilter(filter);
  }

  /**
   * Toggles unread-only filter.
   */
  toggleUnreadOnly(): void {
    this.store.toggleUnreadOnly();
  }

  /**
   * Resets filter to default.
   */
  resetFilter(): void {
    this.store.resetFilter();
  }

  /**
   * Filters by notification type.
   */
  filterByType(type: NotificationType | null): void {
    const currentFilter = this.store.filter();
    this.store.setFilter({
      ...currentFilter,
      types: type ? [type] : []
    });
  }

  // ===========================================================================
  // PREFERENCES
  // ===========================================================================

  /**
   * Loads user preferences.
   */
  loadPreferences(): Observable<NotificationPreference[]> {
    this.store.setLoadingPreferences(true);

    return this.api.getPreferences().pipe(
      tap(preferences => this.store.setPreferences(preferences)),
      catchError(error => {
        this.store.setError('Failed to load preferences');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoadingPreferences(false))
    );
  }

  /**
   * Updates a single preference.
   */
  updatePreference(
    type: NotificationType,
    channel: NotificationChannel,
    enabled: boolean
  ): Observable<NotificationPreference> {
    // Optimistic update
    this.store.updatePreferenceInMatrix(type, channel, enabled);

    const request: UpdatePreferenceRequest = {
      notificationType: type,
      channel: channel,
      enabled: enabled
    };

    return this.api.updatePreference(request).pipe(
      catchError(error => {
        // Revert on failure
        this.store.updatePreferenceInMatrix(type, channel, !enabled);
        return throwError(() => error);
      })
    );
  }

  /**
   * Resets preferences to defaults.
   */
  resetPreferences(): Observable<void> {
    return this.api.resetToDefaults().pipe(
      tap(() => this.loadPreferences().subscribe()),
      map(() => void 0)
    );
  }

  // ===========================================================================
  // UI ACTIONS
  // ===========================================================================

  /**
   * Opens the notification dropdown.
   */
  openDropdown(): void {
    this.store.setDropdownOpen(true);
    // Load fresh data when opening
    this.loadRecentNotifications();
  }

  /**
   * Closes the notification dropdown.
   */
  closeDropdown(): void {
    this.store.setDropdownOpen(false);
  }

  /**
   * Toggles the notification dropdown.
   */
  toggleDropdown(): void {
    if (this.store.isDropdownOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  // ===========================================================================
  // TOAST ACTIONS
  // ===========================================================================

  /**
   * Dismisses the current toast.
   */
  dismissToast(): void {
    this.store.dismissToast();

    // Show next toast after a short delay
    setTimeout(() => {
      if (this.store.toastQueue().length > 0) {
        this.store.showNextToast();
      }
    }, 300);
  }

  /**
   * Clears all toasts.
   */
  clearToasts(): void {
    this.store.clearToasts();
  }

  /**
   * Handles click on toast (navigate to notification).
   */
  onToastClick(notification: Notification): void {
    this.dismissToast();

    // Mark as read
    this.markAsRead(notification.publicId).subscribe();

    // Navigate if action URL exists
    if (notification.actionUrl) {
      // Navigation would be handled by the component
      // This facade just handles the state updates
    }
  }
}
