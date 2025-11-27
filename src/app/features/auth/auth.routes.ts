import { Routes } from '@angular/router';

// ✅ AVANT: import { authGuard } from '../../core/auth/guards/auth.guard';
// ✅ APRÈS: Import depuis le barrel + guestGuard pour les pages login/signup
import { authGuard, guestGuard } from '../../core/auth';

export const AUTH_ROUTES: Routes = [
  // ✅ APRÈS: Pages guest (login, signup) protégées par guestGuard
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login-container/login-container.component')
      .then(m => m.LoginContainerComponent)
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./signup/signup.component')
      .then(m => m.SignupComponent)
  },

  // Public routes (no guard)
  {
    path: 'device-confirmation',
    loadComponent: () => import('./device-confirmation/device-confirmation.component')
      .then(m => m.ConfirmDeviceComponent)
  },
  {
    path: 'account-confirmation',
    loadComponent: () => import('./account-confirmation/account-confirmation.component')
      .then(m => m.AccountConfirmationComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent)
  },

  // Authenticated routes
  {
    path: 'change-password',
    canActivate: [() => authGuard(true)], // true = password change page
    loadComponent: () => import('./change-password/change-password.component')
      .then(m => m.ChangePasswordComponent)
  },
  {
    path: 'verify-email',
    canActivate: [() => authGuard()],
    loadComponent: () => import('./email-confirmation/email-confirmation.component')
      .then(m => m.EmailConfirmationComponent)
  },
  {
    path: 'confirm-email',
    canActivate: [() => authGuard()],
    loadComponent: () => import('./email-confirmation/email-confirmation.component')
      .then(m => m.EmailConfirmationComponent)
  }
];
