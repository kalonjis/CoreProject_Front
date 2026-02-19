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
        path: 'device',
        loadComponent: () => import('./pages/device/device.component')
          .then(m => m.DeviceComponent)
      },
      {
        path: 'address',
        loadComponent: () => import('./pages/address/address.component')
          .then(m => m.AddressComponent)
      },
      {
        path: 'privacy',
        loadComponent: () => import('./pages/privacy/privacy.component')
          .then(m => m.PrivacyComponent)
      },
    ]
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.component')
      .then(m => m.SignupComponent),
  },
  {
    path: 'confirmation',
    loadComponent: () => import('./pages/account-confirmation/account-confirmation.component')
      .then(m => m.AccountConfirmationComponent)
  },
  {
    path: 'deactivation',
    loadComponent: () =>
      import('./pages/account-deactivation-confirmation/account-deactivation-confirmation.component')
        .then(m => m.AccountDeactivationConfirmationComponent)
  },
];
