// src/app/features/notification/components/notification-filters/notification-filters.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  NotificationType,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_ICONS,
  getAllNotificationTypes
} from '../../models/notification.enums';
import { NotificationFilterState } from '../../models/notification.model';

/**
 * Notification filters component.
 *
 * Provides filter tabs for the notification center:
 * - All / Unread toggle
 * - Filter by notification type
 */
@Component({
  selector: 'app-notification-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-filters.component.html',
  styleUrl: './notification-filters.component.scss'
})
export class NotificationFiltersComponent {

  @Input({ required: true }) filter!: NotificationFilterState;
  @Input() unreadCount = 0;

  @Output() filterChange = new EventEmitter<NotificationFilterState>();
  @Output() unreadToggle = new EventEmitter<boolean>();
  @Output() typeSelect = new EventEmitter<NotificationType | null>();

  readonly notificationTypes = getAllNotificationTypes();

  getTypeLabel(type: NotificationType): string {
    return NOTIFICATION_TYPE_LABELS[type];
  }

  getTypeIcon(type: NotificationType): string {
    return NOTIFICATION_TYPE_ICONS[type];
  }

  isTypeSelected(type: NotificationType): boolean {
    return this.filter.types.includes(type);
  }

  onToggleUnread(unreadOnly: boolean): void {
    this.unreadToggle.emit(unreadOnly);
    this.filterChange.emit({
      ...this.filter,
      unreadOnly
    });
  }

  onTypeSelect(type: NotificationType | null): void {
    this.typeSelect.emit(type);
    this.filterChange.emit({
      ...this.filter,
      types: type ? [type] : []
    });
  }
}
