import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';

export const PASSWORD_ROUTES: Routes = [
  {
    path: 'forgot',
    loadComponent: () => import('./forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset',
    loadComponent: () => import('./reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent)
  },
  {
    path: 'change',
    canActivate: [() => authGuard(true)], // Allow access for forced password change
    loadComponent: () => import('./change-password/change-password.component')
      .then(m => m.ChangePasswordComponent)
  },
  {
    path: 'verify-sms',
    loadComponent: () => import('./verify-sms/verify-sms.component')
      .then(m => m.VerifySmsComponent)
  }
];
