// src/app/features/notification/components/notification-dropdown/notification-dropdown.component.ts

import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NotificationFacade } from '../../services/notification.facade';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { Notification } from '../../models/notification.model';
import {ConfirmDialogService} from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';

/**
 * Notification dropdown component.
 *
 * Shows recent notifications in a dropdown panel.
 * Includes quick actions and link to full notification center.
 */
@Component({
    selector: 'app-notification-dropdown',
    imports: [CommonModule, RouterLink, NotificationItemComponent],
    templateUrl: './notification-dropdown.component.html',
    styleUrl: './notification-dropdown.component.scss'
})
export class NotificationDropdownComponent {

  private readonly facade = inject(NotificationFacade);
  private readonly confirmDialog = inject(ConfirmDialogService);

  @Output() close = new EventEmitter<void>();

  // Expose facade signals
  readonly notifications = this.facade.notifications;
  readonly isLoading = this.facade.isLoading;
  readonly hasUnread = this.facade.hasUnread;

  onNotificationClick(notification: Notification): void {
    // Mark as read
    this.facade.markAsRead(notification.publicId).subscribe();

    // Close dropdown
    this.close.emit();
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
      message: 'Effacer toutes les notifications ?',
      confirmButtonText: 'Effacer',
      cancelButtonText: 'Annuler',
      type: 'warning'
    })
      .then(() => {
        this.facade.dismissAll().subscribe(() => {
          this.close.emit();
        });
      })
      .catch(() => {
        // User cancelled
      });
  }

  onViewAllClick(): void {
    this.close.emit();
  }
}
