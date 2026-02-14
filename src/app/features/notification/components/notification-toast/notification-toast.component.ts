// src/app/features/notification/components/notification-toast/notification-toast.component.ts

import {
  Component,
  inject,
  effect,
  signal,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationFacade } from '../../services/notification.facade';
import { Notification, getNotificationIcon } from '../../models/notification.model';
import { NOTIFICATION_PRIORITY_COLORS } from '../../models/notification.enums';

/**
 * Toast notification component.
 *
 * Displays incoming notifications as temporary popups.
 * Auto-dismisses after a timeout, can be clicked to navigate.
 */
@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.scss'
})
export class NotificationToastComponent implements OnDestroy {

  private readonly facade = inject(NotificationFacade);
  private readonly router = inject(Router);

  readonly autoCloseDuration = 5000; // 5 seconds

  private autoCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  // Local state
  readonly isVisible = signal(false);
  readonly isExiting = signal(false);
  readonly isPaused = signal(false);

  // Expose facade signal
  readonly currentToast = this.facade.currentToast;

  constructor() {
    // React to toast changes
    effect(() => {
      const toast = this.currentToast();
      if (toast) {
        this.showToast();
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.clearAutoClose();
  }

  getIcon(notification: Notification): string {
    return getNotificationIcon(notification);
  }

  getPriorityColor(notification: Notification): string {
    return NOTIFICATION_PRIORITY_COLORS[notification.priority];
  }

  onToastClick(notification: Notification): void {
    this.clearAutoClose();

    // Mark as read and close
    this.facade.onToastClick(notification);

    // Navigate if action URL
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }

    this.hideToast();
  }

  onClose(event: Event): void {
    event.stopPropagation();
    this.clearAutoClose();
    this.hideToast();
  }

  pauseAutoClose(): void {
    this.isPaused.set(true);
    this.clearAutoClose();
  }

  resumeAutoClose(): void {
    this.isPaused.set(false);
    this.startAutoClose();
  }

  private showToast(): void {
    // Reset state
    this.isExiting.set(false);

    // Trigger enter animation
    requestAnimationFrame(() => {
      this.isVisible.set(true);
    });

    // Start auto-close timer
    this.startAutoClose();
  }

  private hideToast(): void {
    this.isExiting.set(true);

    // Wait for exit animation, then dismiss
    setTimeout(() => {
      this.isVisible.set(false);
      this.isExiting.set(false);
      this.facade.dismissToast();
    }, 300);
  }

  private startAutoClose(): void {
    this.clearAutoClose();

    this.autoCloseTimeout = setTimeout(() => {
      if (!this.isPaused()) {
        this.hideToast();
      }
    }, this.autoCloseDuration);
  }

  private clearAutoClose(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
      this.autoCloseTimeout = null;
    }
  }
}
