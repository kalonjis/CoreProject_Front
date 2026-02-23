// src/app/features/activity-logs/activity-logs.routes.ts

import { Routes } from '@angular/router';
import { adminGuard } from '../../core/auth/guards/admin.guard';

/**
 * Activity logs feature routes.
 *
 * All routes require ADMIN | SUPER_ADMIN — protected by adminGuard.
 *
 * Structure:
 *   /admin/activity-logs           → container (tabs nav)
 *   /admin/activity-logs/all       → all logs across all users
 *   /admin/activity-logs/user      → user-logs (no user selected)
 *   /admin/activity-logs/user/:publicUserId  → user-logs scoped to a user
 */
export const ACTIVITY_LOGS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [() => adminGuard()],
    loadComponent: () => import('./pages/activity-logs-container/activity-logs-container.component')
      .then(m => m.ActivityLogsContainerComponent),
    children: [
      // Default redirect to all-logs
      {
        path: '',
        redirectTo: 'all',
        pathMatch: 'full',
      },
      // All logs — global view
      {
        path: 'all',
        loadComponent: () => import('./pages/all-logs/all-logs.component')
          .then(m => m.AllLogsComponent),
      },
      // User-scoped — no user pre-selected
      {
        path: 'user',
        loadComponent: () => import('./pages/user-logs/user-logs.component')
          .then(m => m.UserLogsComponent),
      },
      // User-scoped — user resolved from route param
      {
        path: 'user/:publicUserId',
        loadComponent: () => import('./pages/user-logs/user-logs.component')
          .then(m => m.UserLogsComponent),
      },
    ],
  },
];
