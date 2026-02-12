
// src/app/features/notification/pages/notification-preferences/notification-preferences.component.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NotificationFacade } from '../../services/notification.facade';
import {
  NotificationType,
  NotificationChannel,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_ICONS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_CHANNEL_ICONS,
  getAllNotificationTypes,
  getAllNotificationChannels
} from '../../models/notification.enums';

/**
 * Notification Preferences page.
 *
 * Matrix-style preferences editor:
 * - Rows: Notification types
 * - Columns: Delivery channels
 * - Toggle cells to enable/disable
 */
@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-preferences.component.html',
  styleUrl: './notification-preferences.component.scss'
})
export class NotificationPreferencesComponent implements OnInit {

  private readonly facade = inject(NotificationFacade);

  readonly preferenceMatrix = this.facade.preferenceMatrix;
  readonly isLoading = this.facade.isLoadingPreferences;
  readonly error = this.facade.error;

  readonly types = getAllNotificationTypes();
  readonly channels = getAllNotificationChannels();

  // Local state for pending changes
  private readonly pendingChanges = signal<Set<string>>(new Set());

  readonly hasPendingChanges = computed(() => this.pendingChanges().size > 0);

  ngOnInit(): void {
    this.facade.loadPreferences().subscribe();
  }

  getTypeLabel(type: NotificationType): string {
    return NOTIFICATION_TYPE_LABELS[type];
  }

  getTypeIcon(type: NotificationType): string {
    return NOTIFICATION_TYPE_ICONS[type];
  }

  getChannelLabel(channel: NotificationChannel): string {
    return NOTIFICATION_CHANNEL_LABELS[channel];
  }

  getChannelIcon(channel: NotificationChannel): string {
    return NOTIFICATION_CHANNEL_ICONS[channel];
  }

  isEnabled(type: NotificationType, channel: NotificationChannel): boolean {
    const matrix = this.preferenceMatrix();
    return matrix?.[type]?.[channel] ?? false;
  }

  isPending(type: NotificationType, channel: NotificationChannel): boolean {
    return this.pendingChanges().has(`${type}-${channel}`);
  }

  onToggle(type: NotificationType, channel: NotificationChannel): void {
    const key = `${type}-${channel}`;
    const currentValue = this.isEnabled(type, channel);

    // Mark as pending
    this.pendingChanges.update(set => {
      const newSet = new Set(set);
      newSet.add(key);
      return newSet;
    });

    // Update via facade
    this.facade.updatePreference(type, channel, !currentValue).subscribe({
      next: () => {
        this.pendingChanges.update(set => {
          const newSet = new Set(set);
          newSet.delete(key);
          return newSet;
        });
      },
      error: () => {
        this.pendingChanges.update(set => {
          const newSet = new Set(set);
          newSet.delete(key);
          return newSet;
        });
      }
    });
  }

  resetToDefaults(): void {
    if (confirm('Reset all preferences to defaults?')) {
      this.facade.resetPreferences().subscribe();
    }
  }

  refresh(): void {
    this.facade.loadPreferences().subscribe();
  }
}
