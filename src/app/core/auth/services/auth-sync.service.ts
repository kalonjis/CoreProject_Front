import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { AuthStore } from '../state/auth.store';
import { DeviceStore } from '../../device/state/device.store';

/** Events broadcasted between tabs */
type AuthSyncEvent = 'LOGIN' | 'LOGOUT' | 'SESSION_EXPIRED';

interface AuthSyncMessage {
  event: AuthSyncEvent;
  timestamp: number;
}

/**
 * AuthSyncService - Multi-tab synchronization using BroadcastChannel API.
 *
 * Ensures authentication state stays consistent across browser tabs:
 * - User logs out in Tab A → Tab B also logs out
 * - User logs in in Tab A → Tab B refreshes session
 * - Session expires → All tabs redirect to login
 *
 * Uses BroadcastChannel API (modern browsers).
 * Fallback: localStorage events for older browsers.
 */
@Injectable({ providedIn: 'root' })
export class AuthSyncService implements OnDestroy {

  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly deviceStore = inject(DeviceStore);

  private channel: BroadcastChannel | null = null;
  private readonly channelName = 'auth_sync';

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Start listening for auth events from other tabs.
   * Called after successful login/initialization.
   */
  startListening(): void {
    if (this.channel) return; // Already listening

    if ('BroadcastChannel' in window) {
      this.initBroadcastChannel();
    } else {
      this.initLocalStorageFallback();
    }
  }

  /**
   * Stop listening and cleanup.
   * Called on logout or app destroy.
   */
  stopListening(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    window.removeEventListener('storage', this.handleStorageEvent);
  }

  ngOnDestroy(): void {
    this.stopListening();
  }

  // =========================================================================
  // BROADCAST EVENTS
  // =========================================================================

  /** Broadcast login event to other tabs */
  broadcastLogin(): void {
    this.broadcast('LOGIN');
  }

  /** Broadcast logout event to other tabs */
  broadcastLogout(): void {
    this.broadcast('LOGOUT');
  }

  /** Broadcast session expired event to other tabs */
  broadcastSessionExpired(): void {
    this.broadcast('SESSION_EXPIRED');
  }

  // =========================================================================
  // PRIVATE - BROADCAST CHANNEL (Modern)
  // =========================================================================

  private initBroadcastChannel(): void {
    this.channel = new BroadcastChannel(this.channelName);

    this.channel.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
      this.handleSyncEvent(event.data);
    };
  }

  private broadcast(event: AuthSyncEvent): void {
    const message: AuthSyncMessage = {
      event,
      timestamp: Date.now()
    };

    if (this.channel) {
      this.channel.postMessage(message);
    } else {
      // Fallback: use localStorage
      localStorage.setItem('auth_sync_event', JSON.stringify(message));
      localStorage.removeItem('auth_sync_event');
    }
  }

  // =========================================================================
  // PRIVATE - LOCALSTORAGE FALLBACK (Older browsers)
  // =========================================================================

  private initLocalStorageFallback(): void {
    window.addEventListener('storage', this.handleStorageEvent);
  }

  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key !== 'auth_sync_event' || !event.newValue) return;

    try {
      const message: AuthSyncMessage = JSON.parse(event.newValue);
      this.handleSyncEvent(message);
    } catch {
      // Invalid message, ignore
    }
  };

  // =========================================================================
  // PRIVATE - EVENT HANDLING
  // =========================================================================

  private handleSyncEvent(message: AuthSyncMessage): void {
    switch (message.event) {
      case 'LOGIN':
        this.handleRemoteLogin();
        break;

      case 'LOGOUT':
      case 'SESSION_EXPIRED':
        this.handleRemoteLogout();
        break;
    }
  }

  private handleRemoteLogin(): void {
    // Another tab logged in - reload page to refresh session
    window.location.reload();
  }

  private handleRemoteLogout(): void {
    // Another tab logged out - clear state and redirect
    this.authStore.reset();
    this.deviceStore.reset();
    this.router.navigate(['/auth/login'], {
      queryParams: { loggedOut: 'true' }
    });
  }
}
