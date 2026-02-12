
// src/app/features/notification/notification.routes.ts

import { Routes } from '@angular/router';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/notification-center/notification-center.component')
        .then(m => m.NotificationCenterComponent),
    title: 'Notifications'
  },
  {
    path: 'preferences',
    loadComponent: () =>
      import('./pages/notification-preferences/notification-preferences.component')
        .then(m => m.NotificationPreferencesComponent),
    title: 'Notification Preferences'
  }
];

