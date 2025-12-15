// src/app/features/account/account.routes.ts

import { Routes } from '@angular/router';
import { AccountContainerComponent } from './account-container.component';

/**
 * Account management routes.
 * Handles user profile, security settings, and device management.
 */
export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    component: AccountContainerComponent,
    children: [
      // Default redirect to profile tab
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      // Profile tab - temporarily redirect to old profile component
      {
        path: 'profile',
        loadComponent: () => import('./components/profile-tab/profile-tab.component')
          .then(m => m.ProfileTabComponent)
      },
      {
        path: 'security',
        loadComponent: () => import('./components/security-tab/security-tab.component')
        .then(m => m.SecurityTabComponent)
      },
      {
        path: 'security/two-factor',
        loadChildren: () => import('./pages/two-factor/two-factor.routes')
          .then(m => m.TWO_FACTOR_ROUTES)
      },
      {
        path: 'devices',
        loadComponent: () => import('./components/device-tab/device-tab.component')
          .then(m => m.DeviceTabComponent)
      }
    ]
  }
];
