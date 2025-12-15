// src/app/features/account/pages/two-factor/two-factor.recovery.routes.ts

import { Routes } from '@angular/router';

export const TWO_FACTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./two-factor-overview/two-factor-overview.component')
      .then(m => m.TwoFactorOverviewComponent)
  },
  {
    path: 'email',
    loadComponent: () => import('./email-two-factor/email-two-factor.component')
      .then(m => m.EmailTwoFactorComponent)
  },
  {
    path: 'totp',
    loadComponent: () => import('./totp-two-factor/totp-two-factor.component')
      .then(m => m.TotpTwoFactorComponent)
  }
];
