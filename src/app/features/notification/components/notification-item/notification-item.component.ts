// src/app/features/notification/components/notification-item/notification-item.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  Notification,
  isNotificationUnread,
  getNotificationIcon,
  getRelativeTime
} from '../../models/notification.model';
import {
  NOTIFICATION_PRIORITY_COLORS
} from '../../models/notification.enums';

/**
 * Single notification item component.
 *
 * Displays a notification with icon, title, body, time, and action buttons.
 * Used in both dropdown and full notification center.
 */
@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-item.component.html',
  styleUrl: './notification-item.component.scss'
})
export class NotificationItemComponent {

  @Input({ required: true }) notification!: Notification;
  @Input() showActions = true;
  @Input() showAction = true;
  @Input() showUnreadDot = true;
  @Input() showPriorityIndicator = false;

  @Output() markAsRead = new EventEmitter<string>();
  @Output() dismiss = new EventEmitter<string>();
  @Output() itemClick = new EventEmitter<Notification>();
  @Output() actionClick = new EventEmitter<Notification>();

  get isUnread(): boolean {
    return isNotificationUnread(this.notification);
  }

  get icon(): string {
    return getNotificationIcon(this.notification);
  }

  get relativeTime(): string {
    return getRelativeTime(this.notification.createdAt);
  }

  get priorityColor(): string {
    return NOTIFICATION_PRIORITY_COLORS[this.notification.priority];
  }

  onItemClick(): void {
    this.itemClick.emit(this.notification);
  }

  onActionClick(event: Event): void {
    event.stopPropagation();
    this.actionClick.emit(this.notification);
  }

  onMarkAsRead(event: Event): void {
    event.stopPropagation();
    this.markAsRead.emit(this.notification.publicId);
  }

  onDismiss(event: Event): void {
    event.stopPropagation();
    this.dismiss.emit(this.notification.publicId);
  }
}
