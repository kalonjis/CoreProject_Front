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
    path: 'change-password',
    canActivate: [() => authGuard(true)], // Pass true to indicate this is the password change page
    loadComponent: () => import('./change-password/change-password.component').then(m => m.ChangePasswordComponent)
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
  },
  {
    path: 'webauthn-test',
    canActivate: [() => authGuard()],
    loadComponent: () => import('./webauthn-test/webauthn-test.component').then(m => m.WebAuthnTestComponent)
  },
  /*

  {
    path: 'device-confirmation',
    loadComponent: () => import('./device-confirmation/device-confirmation.component').then(m => m.DeviceConfirmationComponent)
  }*/
];
