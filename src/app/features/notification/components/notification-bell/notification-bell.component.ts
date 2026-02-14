// src/app/features/notification/components/notification-bell/notification-bell.component.ts

import {
  Component,
  inject,
  ElementRef,
  HostListener,
  signal, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NotificationFacade } from '../../services/notification.facade';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { SseConnectionStatus } from '../../models/notification.state';

/**
 * Notification bell icon component for navbar.
 *
 * Displays:
 * - Bell icon with unread count badge
 * - Connection status indicator
 * - Dropdown on click
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationDropdownComponent],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss'
})
export class NotificationBellComponent {

  private readonly facade = inject(NotificationFacade);
  private readonly elementRef = inject(ElementRef);

  // Ringing animation state
  private readonly _isRinging = signal(false);

  // Expose facade signals
  readonly unreadCount = this.facade.unreadCount;
  readonly isDropdownOpen = this.facade.isDropdownOpen;
  readonly sseStatus = this.facade.sseStatus;

  constructor() {
    // Debug: log unreadCount changes
    effect(() => {
      console.log('[NotificationBell] unreadCount:', this.unreadCount());
    });
  }

  // Computed states
  hasUnread = () => this.unreadCount() > 0;
  isConnected = () => this.sseStatus() === SseConnectionStatus.CONNECTED;
  isReconnecting = () => this.sseStatus() === SseConnectionStatus.RECONNECTING;
  isDisconnected = () =>
    this.sseStatus() === SseConnectionStatus.DISCONNECTED ||
    this.sseStatus() === SseConnectionStatus.ERROR;
  isRinging = () => this._isRinging();

  connectionStatusText(): string {
    switch (this.sseStatus()) {
      case SseConnectionStatus.CONNECTED:
        return 'Connected - Real-time updates active';
      case SseConnectionStatus.RECONNECTING:
        return 'Reconnecting...';
      case SseConnectionStatus.CONNECTING:
        return 'Connecting...';
      default:
        return 'Disconnected - Updates paused';
    }
  }

  toggleDropdown(): void {
    this.facade.toggleDropdown();
  }

  closeDropdown(): void {
    this.facade.closeDropdown();
  }

  /**
   * Triggers the ringing animation (called when new notification arrives).
   */
  ring(): void {
    this._isRinging.set(true);
    setTimeout(() => this._isRinging.set(false), 500);
  }

  /**
   * Close dropdown when clicking outside.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isDropdownOpen()) {
        this.closeDropdown();
      }
    }
  }

  /**
   * Close dropdown on Escape key.
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isDropdownOpen()) {
      this.closeDropdown();
    }
  }
}
