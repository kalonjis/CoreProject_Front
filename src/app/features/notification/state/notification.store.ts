// src/app/features/notification/state/notification.store.ts

import { Injectable, computed, signal } from '@angular/core';
import {
  Notification,
  NotificationFilterState,
  DEFAULT_NOTIFICATION_FILTER,
  isNotificationUnread,
  sortNotificationsByDate,
  filterNotifications
} from '../models/notification.model';
import {
  NotificationPreference,
  PreferenceMatrix,
  preferencesToMatrix
} from '../models/notification-preference.model';
import {
  NotificationState,
  SseConnectionStatus,
  initialNotificationState
} from '../models/notification.state';

/**
 * NotificationStore - Signal-based state management for notifications.
 *
 * Responsibilities:
 * - Hold notification state (signals)
 * - Provide computed values (derived state)
 * - Expose mutations to modify state
 *
 * Does NOT handle:
 * - HTTP calls (see NotificationApiService)
 * - SSE connection (see NotificationSseService)
 * - Orchestration (see NotificationFacade)
 */
@Injectable({ providedIn: 'root' })
export class NotificationStore {

  // ===========================================================================
  // STATE (private signals)
  // ===========================================================================

  private readonly _state = signal<NotificationState>(initialNotificationState);

  // ===========================================================================
  // SELECTORS (public readonly)
  // ===========================================================================

  /** Full state (readonly) */
  readonly state = this._state.asReadonly();

  /** All loaded notifications */
  readonly notifications = computed(() => this._state().notifications);

  /** Unread notification count */
  readonly unreadCount = computed(() => this._state().unreadCount);

  /** Total notification count */
  readonly totalCount = computed(() => this._state().totalCount);

  /** Current filter state */
  readonly filter = computed(() => this._state().filter);

  /** Has more pages to load */
  readonly hasMore = computed(() => this._state().hasMore);

  /** User preferences */
  readonly preferences = computed(() => this._state().preferences);

  /** Preference matrix */
  readonly preferenceMatrix = computed(() => this._state().preferenceMatrix);

  /** SSE connection status */
  readonly sseStatus = computed(() => this._state().sseStatus);

  /** Loading state */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Loading preferences state */
  readonly isLoadingPreferences = computed(() => this._state().isLoadingPreferences);

  /** Dropdown open state */
  readonly isDropdownOpen = computed(() => this._state().isDropdownOpen);

  /** Error message */
  readonly error = computed(() => this._state().error);

  /** Toast queue */
  readonly toastQueue = computed(() => this._state().toastQueue);

  /** Current toast */
  readonly currentToast = computed(() => this._state().currentToast);

  // ===========================================================================
  // COMPUTED SELECTORS (derived state)
  // ===========================================================================

  /** Filtered notifications based on current filter */
  readonly filteredNotifications = computed(() => {
    const notifications = this._state().notifications;
    const filter = this._state().filter;
    return filterNotifications(sortNotificationsByDate(notifications), filter);
  });

  /** Unread notifications only */
  readonly unreadNotifications = computed(() =>
    this._state().notifications.filter(isNotificationUnread)
  );

  /** Has unread notifications */
  readonly hasUnread = computed(() => this._state().unreadCount > 0);

  /** SSE is connected */
  readonly isConnected = computed(() =>
    this._state().sseStatus === SseConnectionStatus.CONNECTED
  );

  /** SSE is reconnecting */
  readonly isReconnecting = computed(() =>
    this._state().sseStatus === SseConnectionStatus.RECONNECTING
  );

  /** SSE circuit is open (max retries exhausted, polling takes over) */
  readonly isCircuitOpen = computed(() =>
    this._state().sseStatus === SseConnectionStatus.CIRCUIT_OPEN
  );

  /** Has pending toasts */
  readonly hasToasts = computed(() =>
    this._state().toastQueue.length > 0 || this._state().currentToast !== null
  );

  // ===========================================================================
  // MUTATIONS - Notifications
  // ===========================================================================

  /**
   * Sets notifications (replaces all).
   */
  setNotifications(notifications: Notification[]): void {
    this._state.update(state => ({
      ...state,
      notifications: sortNotificationsByDate(notifications)
    }));
  }

  /**
   * Appends notifications (for pagination).
   */
  appendNotifications(notifications: Notification[]): void {
    this._state.update(state => ({
      ...state,
      notifications: sortNotificationsByDate([
        ...state.notifications,
        ...notifications
      ])
    }));
  }

  /**
   * Adds a single notification (from SSE).
   */
  addNotification(notification: Notification): void {
    this._state.update(state => ({
      ...state,
      notifications: sortNotificationsByDate([notification, ...state.notifications]),
      unreadCount: state.unreadCount + 1,
      totalCount: state.totalCount + 1
    }));
  }

  /**
   * Updates a notification.
   */
  updateNotification(publicId: string, updates: Partial<Notification>): void {
    this._state.update(state => ({
      ...state,
      notifications: state.notifications.map(n =>
        n.publicId === publicId ? { ...n, ...updates } : n
      )
    }));
  }

  /**
   * Removes a notification.
   */
  removeNotification(publicId: string): void {
    this._state.update(state => {
      const notification = state.notifications.find(n => n.publicId === publicId);
      const wasUnread = notification ? isNotificationUnread(notification) : false;

      return {
        ...state,
        notifications: state.notifications.filter(n => n.publicId !== publicId),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        totalCount: state.totalCount - 1
      };
    });
  }

  /**
   * Marks a notification as read.
   */
  markAsRead(publicId: string): void {
    this._state.update(state => {
      const notification = state.notifications.find(n => n.publicId === publicId);
      const wasUnread = notification ? isNotificationUnread(notification) : false;

      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.publicId === publicId
            ? { ...n, status: 'READ' as any, readAt: new Date().toISOString() }
            : n
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    });
  }

  /**
   * Marks all notifications as read.
   */
  markAllAsRead(): void {
    this._state.update(state => ({
      ...state,
      notifications: state.notifications.map(n => ({
        ...n,
        status: 'READ' as any,
        readAt: n.readAt || new Date().toISOString()
      })),
      unreadCount: 0
    }));
  }

  /**
   * Sets unread count.
   */
  setUnreadCount(count: number): void {
    this._state.update(state => ({ ...state, unreadCount: count }));
  }

  /**
   * Sets total count.
   */
  setTotalCount(count: number): void {
    this._state.update(state => ({ ...state, totalCount: count }));
  }

  /**
   * Sets pagination state.
   */
  setPagination(currentPage: number, hasMore: boolean): void {
    this._state.update(state => ({ ...state, currentPage, hasMore }));
  }

  // ===========================================================================
  // MUTATIONS - Filter
  // ===========================================================================

  /**
   * Sets filter state.
   */
  setFilter(filter: NotificationFilterState): void {
    this._state.update(state => ({ ...state, filter }));
  }

  /**
   * Resets filter to default.
   */
  resetFilter(): void {
    this._state.update(state => ({ ...state, filter: DEFAULT_NOTIFICATION_FILTER }));
  }

  /**
   * Toggles unread-only filter.
   */
  toggleUnreadOnly(): void {
    this._state.update(state => ({
      ...state,
      filter: { ...state.filter, unreadOnly: !state.filter.unreadOnly }
    }));
  }

  // ===========================================================================
  // MUTATIONS - Preferences
  // ===========================================================================

  /**
   * Sets preferences.
   */
  setPreferences(preferences: NotificationPreference[]): void {
    this._state.update(state => ({
      ...state,
      preferences,
      preferenceMatrix: preferencesToMatrix(preferences)
    }));
  }

  /**
   * Updates a single preference in the matrix.
   */
  updatePreferenceInMatrix(
    type: string,
    channel: string,
    enabled: boolean
  ): void {
    this._state.update(state => {
      if (!state.preferenceMatrix) return state;

      const newMatrix = { ...state.preferenceMatrix };
      if (newMatrix[type as keyof typeof newMatrix]) {
        newMatrix[type as keyof typeof newMatrix] = {
          ...newMatrix[type as keyof typeof newMatrix],
          [channel]: enabled
        };
      }

      return { ...state, preferenceMatrix: newMatrix };
    });
  }

  // ===========================================================================
  // MUTATIONS - SSE Connection
  // ===========================================================================

  /**
   * Sets SSE connection status.
   */
  setSseStatus(status: SseConnectionStatus): void {
    this._state.update(state => ({ ...state, sseStatus: status }));
  }

  /**
   * Increments reconnect attempts.
   */
  incrementReconnectAttempts(): void {
    this._state.update(state => ({
      ...state,
      reconnectAttempts: state.reconnectAttempts + 1
    }));
  }

  /**
   * Resets reconnect attempts.
   */
  resetReconnectAttempts(): void {
    this._state.update(state => ({ ...state, reconnectAttempts: 0 }));
  }

  // ===========================================================================
  // MUTATIONS - UI State
  // ===========================================================================

  /**
   * Sets loading state.
   */
  setLoading(isLoading: boolean): void {
    this._state.update(state => ({ ...state, isLoading }));
  }

  /**
   * Sets loading preferences state.
   */
  setLoadingPreferences(isLoadingPreferences: boolean): void {
    this._state.update(state => ({ ...state, isLoadingPreferences }));
  }

  /**
   * Sets dropdown open state.
   */
  setDropdownOpen(isOpen: boolean): void {
    this._state.update(state => ({ ...state, isDropdownOpen: isOpen }));
  }

  /**
   * Toggles dropdown.
   */
  toggleDropdown(): void {
    this._state.update(state => ({ ...state, isDropdownOpen: !state.isDropdownOpen }));
  }

  /**
   * Sets error message.
   */
  setError(error: string | null): void {
    this._state.update(state => ({ ...state, error }));
  }

  // ===========================================================================
  // MUTATIONS - Toast Queue
  // ===========================================================================

  /**
   * Adds notification to toast queue.
   */
  enqueueToast(notification: Notification): void {
    this._state.update(state => ({
      ...state,
      toastQueue: [...state.toastQueue, notification]
    }));
  }

  /**
   * Shows next toast from queue.
   */
  showNextToast(): void {
    this._state.update(state => {
      const [next, ...remaining] = state.toastQueue;
      return {
        ...state,
        currentToast: next || null,
        toastQueue: remaining
      };
    });
  }

  /**
   * Dismisses current toast.
   */
  dismissToast(): void {
    this._state.update(state => ({ ...state, currentToast: null }));
  }

  /**
   * Clears all toasts.
   */
  clearToasts(): void {
    this._state.update(state => ({
      ...state,
      toastQueue: [],
      currentToast: null
    }));
  }

  // ===========================================================================
  // RESET
  // ===========================================================================

  /**
   * Resets store to initial state.
   */
  reset(): void {
    this._state.set(initialNotificationState);
  }
}
