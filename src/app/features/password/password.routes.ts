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
    path: 'reset-code',
    loadComponent: () => import('./reset-password-code/reset-password-code.component')
      .then(m => m.ResetPasswordCodeComponent)
  },
  {
    path: 'change',
    canActivate: [() => authGuard(true)], // Allow access for forced password change
    loadComponent: () => import('./change-password/change-password.component')
      .then(m => m.ChangePasswordComponent)
  },
  {
    path: 'define',
    canActivate: [() => authGuard(true)],
    loadComponent: () => import('./define-password/define-password.component')
      .then(m => m.DefinePasswordComponent)
  },
  {
    path: 'verify-code',
    loadComponent: () => import('./verify-code/verify-code.component')
      .then(m => m.VerifyCodeComponent)
  }
];
