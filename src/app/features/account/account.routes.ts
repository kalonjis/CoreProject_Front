// src/app/features/account/account.recovery.routes.ts

import { Routes } from '@angular/router';
import { AccountContainerComponent } from './account-container.component';
import {authGuard} from '../../core/auth';

/**
 * Account management routes.
 * Handles user profile, security settings, and device management.
 */
export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    component: AccountContainerComponent,
    canActivate: [() => authGuard()],
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
        loadComponent: () => import('./pages/profile/profile.component')
          .then(m => m.ProfileComponent)
      },
      {
        path: 'security',
        loadComponent: () => import('./pages/security/security.component')
        .then(m => m.SecurityComponent)
      },
      {
        path: 'security/two-factor',
        loadChildren: () => import('./pages/two-factor/two-factor.routes')
          .then(m => m.TWO_FACTOR_ROUTES)
      },
      {
        path: 'security/recovery',
        loadChildren: () => import('./pages/recovery/recovery.routes')
          .then(m => m.RECOVERY_ROUTES)
      },
      {
        path: 'devices',
        loadComponent: () => import('./pages/devices/device.component')
          .then(m => m.DeviceComponent)
      },
      {
        path: 'addresses',
        loadComponent: () => import('./pages/addresses/addresses.component')
          .then(m => m.AddressesComponent)
      }
    ]
  },
  {
    path: 'signup',
    loadComponent: () => import('./components/signup/signup.component')
      .then(m => m.SignupComponent),
  },
  {
    path: 'confirmation',
    loadComponent: () => import('./components/account-confirmation/account-confirmation.component')
      .then(m => m.AccountConfirmationComponent)
  },
];
