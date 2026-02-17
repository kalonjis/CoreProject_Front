
// src/app/features/notification/pages/notification-center/notification-center.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NotificationFacade } from '../../services/notification.facade';
import { NotificationItemComponent } from '../../components/notification-item/notification-item.component';
import { NotificationFiltersComponent } from '../../components/notification-filters/notification-filters.component';
import { Notification, NotificationFilterState } from '../../models/notification.model';
import { NotificationType } from '../../models/notification.enums';
import {ConfirmDialogService} from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';

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
  private readonly confirmDialog = inject(ConfirmDialogService);

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

  dismissAll(): void {
    this.confirmDialog.confirm({
      title: 'Effacer les notifications',
      message: 'Êtes-vous sûr de vouloir effacer toutes vos notifications ? Cette action est irréversible.',
      confirmButtonText: 'Effacer tout',
      cancelButtonText: 'Annuler',
      type: 'warning'
    })
      .then(() => {
        this.facade.dismissAll().subscribe();
      })
      .catch(() => {
        // User cancelled - do nothing
      });
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
