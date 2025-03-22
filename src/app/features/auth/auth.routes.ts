import {Routes} from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent)
  },
  /*{
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'account-confirmation',
    loadComponent: () => import('./account-confirmation/account-confirmation.component').then(m => m.AccountConfirmationComponent)
  },
  {
    path: 'email-confirmation',
    loadComponent: () => import('./email-confirmation/email-confirmation.component').then(m => m.EmailConfirmationComponent)
  },
  {
    path: 'device-confirmation',
    loadComponent: () => import('./device-confirmation/device-confirmation.component').then(m => m.DeviceConfirmationComponent)
  }*/
];
