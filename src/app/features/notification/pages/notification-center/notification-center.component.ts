
// src/app/features/notification/pages/notification-center/notification-center.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NotificationFacade } from '../../services/notification.facade';
import { NotificationItemComponent } from '../../components/notification-item/notification-item.component';
import { NotificationFiltersComponent } from '../../components/notification-filters/notification-filters.component';
import { Notification, NotificationFilterState } from '../../models/notification.model';
import { NotificationType } from '../../models/notification.enums';

/**
 * Notification Center page.
 *
 * Full-page notification management with:
 * - Filter tabs (All / Unread)
 * - Type filters
 * - Infinite scroll pagination
 * - Bulk actions
 */
@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NotificationItemComponent,
    NotificationFiltersComponent
  ],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss'
})
export class NotificationCenterComponent implements OnInit {

  private readonly facade = inject(NotificationFacade);

  // Exposed signals
  readonly notifications = this.facade.notifications;
  readonly unreadCount = this.facade.unreadCount;
  readonly totalCount = this.facade.totalCount;
  readonly hasMore = this.facade.hasMore;
  readonly isLoading = this.facade.isLoading;
  readonly filter = this.facade.filter;
  readonly error = this.facade.error;

  ngOnInit(): void {
    this.facade.refresh();
  }

  onFilterChange(filter: NotificationFilterState): void {
    this.facade.setFilter(filter);
  }

  onUnreadToggle(unreadOnly: boolean): void {
    if (unreadOnly) {
      this.facade.toggleUnreadOnly();
    } else {
      this.facade.resetFilter();
    }
  }

  onTypeSelect(type: NotificationType | null): void {
    this.facade.filterByType(type);
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.readAt) {
      this.facade.markAsRead(notification.publicId).subscribe();
    }
  }

  onMarkAsRead(publicId: string): void {
    this.facade.markAsRead(publicId).subscribe();
  }

  onDismiss(publicId: string): void {
    this.facade.deleteNotification(publicId).subscribe();
  }

  markAllAsRead(): void {
    this.facade.markAllAsRead().subscribe();
  }

  loadMore(): void {
    if (!this.isLoading() && this.hasMore()) {
      this.facade.loadMore();
    }
  }

  refresh(): void {
    this.facade.refresh();
  }

  trackByPublicId(_: number, notification: Notification): string {
    return notification.publicId;
  }
}
