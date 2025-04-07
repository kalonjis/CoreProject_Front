import {Routes} from '@angular/router';
import {authGuard} from '../../core/auth/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'device-confirmation',
    loadComponent: () => import('./device-confirmation/device-confirmation.component')
      .then(m => m.ConfirmDeviceComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'account-confirmation',
    loadComponent: () => import('./account-confirmation/account-confirmation.component').then(m => m.AccountConfirmationComponent)
  },


  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'verify-email',
    canActivate: [() => authGuard()],
    loadComponent: () => import('./email-confirmation/email-confirmation.component').then(m => m.EmailConfirmationComponent)
  },
  {
    path: 'confirm-email',
    canActivate: [() => authGuard()],
    loadComponent: () => import('./email-confirmation/email-confirmation.component').then(m => m.EmailConfirmationComponent)
  },
  {
    path: 'confirm-email',
    canActivate: [() => authGuard()],
    loadComponent: () => import('./email-confirmation/email-confirmation.component').then(m => m.EmailConfirmationComponent)
  }
  /*

  {
    path: 'email-confirmation',
    loadComponent: () => import('./email-confirmation/email-confirmation.component').then(m => m.EmailConfirmationComponent)
  },
  {
    path: 'device-confirmation',
    loadComponent: () => import('./device-confirmation/device-confirmation.component').then(m => m.DeviceConfirmationComponent)
  }*/
];
