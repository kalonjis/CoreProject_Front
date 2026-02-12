// src/app/features/notification/services/notification-sse.service.ts

import { Injectable, inject, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { SseNotificationPayload, ssePayloadToNotification, Notification } from '../models/notification.model';
import { SseConnectionStatus } from '../models/notification.state';

/**
 * SSE Event types sent by the server.
 */
export type SseEventType = 'connected' | 'notification' | 'heartbeat';

/**
 * SSE Event wrapper.
 */
export interface SseEvent {
  type: SseEventType;
  data: unknown;
}

/**
 * NotificationSseService - Manages SSE connection for real-time notifications.
 *
 * Responsibilities:
 * - Establish and maintain SSE connection
 * - Parse incoming events
 * - Handle reconnection with exponential backoff
 * - Emit events via Observables
 *
 * Does NOT manage state - that's the store's job.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSseService {

  private readonly ngZone = inject(NgZone);
  private readonly sseUrl = '/api/notifications/stream';

  // EventSource instance
  private eventSource: EventSource | null = null;

  // Reconnection configuration
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelay = 1000;  // 1 second
  private readonly maxReconnectDelay = 30000;  // 30 seconds
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Event subjects
  private readonly _statusChange = new Subject<SseConnectionStatus>();
  private readonly _notification = new Subject<Notification>();
  private readonly _heartbeat = new Subject<void>();
  private readonly _error = new Subject<Error>();

  // Public observables
  readonly statusChange$ = this._statusChange.asObservable();
  readonly notification$ = this._notification.asObservable();
  readonly heartbeat$ = this._heartbeat.asObservable();
  readonly error$ = this._error.asObservable();

  // Current status
  private _currentStatus: SseConnectionStatus = SseConnectionStatus.DISCONNECTED;

  get currentStatus(): SseConnectionStatus {
    return this._currentStatus;
  }

  get isConnected(): boolean {
    return this._currentStatus === SseConnectionStatus.CONNECTED;
  }

  // ===========================================================================
  // CONNECTION MANAGEMENT
  // ===========================================================================

  /**
   * Connects to the SSE stream.
   */
  connect(): void {
    // Don't reconnect if already connected or connecting
    if (this.eventSource) {
      console.warn('[SSE] Already connected or connecting');
      return;
    }

    this.updateStatus(SseConnectionStatus.CONNECTING);
    console.log('[SSE] Connecting to', this.sseUrl);

    // Create EventSource outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      this.eventSource = new EventSource(this.sseUrl, {
        withCredentials: true  // Send cookies for authentication
      });

      this.setupEventListeners();
    });
  }

  /**
   * Disconnects from the SSE stream.
   */
  disconnect(): void {
    console.log('[SSE] Disconnecting');

    this.clearReconnectTimeout();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.reconnectAttempts = 0;
    this.updateStatus(SseConnectionStatus.DISCONNECTED);
  }

  /**
   * Forces a reconnection.
   */
  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  // ===========================================================================
  // PRIVATE - Event Listeners
  // ===========================================================================

  private setupEventListeners(): void {
    if (!this.eventSource) return;

    // Connection opened
    this.eventSource.onopen = () => {
      this.ngZone.run(() => {
        console.log('[SSE] Connection opened');
        this.reconnectAttempts = 0;
        this.updateStatus(SseConnectionStatus.CONNECTED);
      });
    };

    // Connection error
    this.eventSource.onerror = (event) => {
      this.ngZone.run(() => {
        console.error('[SSE] Connection error', event);
        this.handleError();
      });
    };

    // Custom event: connected (server confirmation)
    this.eventSource.addEventListener('connected', (event: MessageEvent) => {
      this.ngZone.run(() => {
        console.log('[SSE] Server confirmed connection', event.data);
      });
    });

    // Custom event: notification
    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      this.ngZone.run(() => {
        this.handleNotificationEvent(event);
      });
    });

    // Custom event: heartbeat
    this.eventSource.addEventListener('heartbeat', () => {
      this.ngZone.run(() => {
        this._heartbeat.next();
      });
    });
  }

  // ===========================================================================
  // PRIVATE - Event Handlers
  // ===========================================================================

  private handleNotificationEvent(event: MessageEvent): void {
    try {
      const payload: SseNotificationPayload = JSON.parse(event.data);
      const notification = ssePayloadToNotification(payload);

      console.log('[SSE] Notification received:', notification.publicId);
      this._notification.next(notification);

    } catch (error) {
      console.error('[SSE] Failed to parse notification event:', error);
      this._error.next(new Error('Failed to parse notification'));
    }
  }

  private handleError(): void {
    // Close the broken connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.updateStatus(SseConnectionStatus.ERROR);
    this._error.next(new Error('SSE connection error'));

    // Attempt reconnection
    this.scheduleReconnect();
  }

  // ===========================================================================
  // PRIVATE - Reconnection Logic
  // ===========================================================================

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnection attempts reached');
      this.updateStatus(SseConnectionStatus.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.updateStatus(SseConnectionStatus.RECONNECTING);

    // Exponential backoff with jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1) +
      Math.random() * 1000,
      this.maxReconnectDelay
    );

    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // ===========================================================================
  // PRIVATE - Status Management
  // ===========================================================================

  private updateStatus(status: SseConnectionStatus): void {
    if (this._currentStatus !== status) {
      this._currentStatus = status;
      this._statusChange.next(status);
    }
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Cleanup on service destroy.
   */
  ngOnDestroy(): void {
    this.disconnect();
    this._statusChange.complete();
    this._notification.complete();
    this._heartbeat.complete();
    this._error.complete();
  }
}
