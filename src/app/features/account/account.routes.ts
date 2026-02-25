// src/app/features/account/account.routes.ts

import { Routes } from '@angular/router';
import { AccountContainerComponent } from './account-container.component';
import { authGuard } from '../../core/auth';

/**
 * Account feature routes.
 *
 * Two route groups:
 *
 * 1. AUTHENTICATED — nested under AccountContainerComponent (tabs layout, authGuard).
 *    All routes the user navigates to while logged in.
 *
 * 2. PUBLIC — standalone pages accessed via email links (no authGuard).
 *    Token-based flows that must work without an active session.
 *
 * GDPR export routes (public):
 * - /account/export/confirm?token=   → ExportConfirmationComponent
 *     Confirms the export request. Token comes from the confirmation email.
 *     Calls GET /api/privacy/export/confirm?token= on init.
 *
 * - /account/export/download?token=  → ExportDownloadComponent
 *     Downloads the generated archive. Token comes from the ready email.
 *     Calls GET /api/privacy/export/download?token= on init and triggers
 *     the browser download dialog automatically.
 */
export const ACCOUNT_ROUTES: Routes = [

  // ===========================================================================
  // AUTHENTICATED — layout with tabs
  // ===========================================================================

  {
    path: '',
    component: AccountContainerComponent,
    canActivate: [() => authGuard()],
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./pages/security/security.component').then(m => m.SecurityComponent),
      },
      {
        path: 'security/two-factor',
        loadChildren: () =>
          import('./pages/two-factor/two-factor.routes').then(m => m.TWO_FACTOR_ROUTES),
      },
      {
        path: 'security/recovery',
        loadChildren: () =>
          import('./pages/recovery/recovery.routes').then(m => m.RECOVERY_ROUTES),
      },
      {
        path: 'device',
        loadComponent: () =>
          import('./pages/device/device.component').then(m => m.DeviceComponent),
      },
      {
        path: 'address',
        loadComponent: () =>
          import('./pages/address/address.component').then(m => m.AddressComponent),
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./pages/privacy/privacy.component').then(m => m.PrivacyComponent),
      },
      {
        path: 'deletion-request',
        loadComponent: () => import('./pages/delete-account/delete-account.component')
          .then(m => m.DeleteAccountComponent)
      }
    ]
  },

  // ===========================================================================
  // PUBLIC — account lifecycle (email link flows)
  // ===========================================================================

  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'confirmation',
    loadComponent: () =>
      import('./pages/account-confirmation/account-confirmation.component')
        .then(m => m.AccountConfirmationComponent),
  },
  {
    path: 'deactivation',
    loadComponent: () =>
      import('./pages/account-deactivation-confirmation/account-deactivation-confirmation.component')
        .then(m => m.AccountDeactivationConfirmationComponent),
  },
  {
    path: 'reactivation',
    loadComponent: () =>
      import('./pages/account-reactivation/account-reactivation.component')
        .then(m => m.AccountReactivationComponent),
  },

  {
    path: 'deletion',
    loadComponent: () => import('./pages/account-deletion-confirmation/account-deletion-confirmation.component')
      .then(m => m.AccountDeletionConfirmationComponent)
  },

  // ===========================================================================
  // PUBLIC — GDPR export (email link flows)
  // ===========================================================================

  {
    path: 'export/confirm',
    loadComponent: () =>
      import('./pages/export-confirmation/export-confirmation.component')
        .then(m => m.ExportConfirmationComponent),
    title: 'Confirm data export',
  },
  {
    path: 'export/download',
    loadComponent: () =>
      import('./pages/export-download/export-download.component')
        .then(m => m.ExportDownloadComponent),
    title: 'Download my data',
  },
];
