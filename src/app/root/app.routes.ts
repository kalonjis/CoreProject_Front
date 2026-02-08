import { Routes } from '@angular/router';
import {authGuard} from '../core/auth/guards/auth.guard';
import {adminGuard} from '../core/auth/guards/admin.guard';

export const routes: Routes = [
  // Routes publiques
  {
    path: '',
    loadComponent: () => import('../features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('../features/auth/auth.routes').then(r => r.AUTH_ROUTES)
  },
  {
    path: 'password',
    loadChildren: () => import('../features/password/password.routes').then(r => r.PASSWORD_ROUTES)
  },
  {
    path: 'account',
    loadChildren: () =>import('../features/account/account.routes').then(r => r.ACCOUNT_ROUTES)
  },
  {
    path: 'devices',
    canActivate: [() => authGuard()],
    loadChildren: () => import('../features/devices/device.routes').then(r => r.DEVICE_ROUTES)
  },
  // Routes d'administration
  {
    path: 'admin',
    loadChildren: () => import('../features/admin/admin.routes').then(r => r.ADMIN_ROUTES)
  },
  {
    path: 'sport',
    canActivate: [() => authGuard()],
    loadChildren: () => import('../features/sport/sport.routes').then(r => r.SPORT_ROUTES)
  },
  {
    path: 'contact',
    loadChildren: () => import('../features/contact/contact.routes')
      .then(m => m.CONTACT_ROUTES)
  },
  {
    path: 'calendar',
    loadChildren: () => import('../features/calendar/calendar.routes')
        .then(m => m.CALENDAR_ROUTES)
  }
/*
  // Routes authentifiées standard
  {
    path: 'profile',
    canActivate: [sessionGuard()], // Niveau de confiance par défaut (BASIC)
    loadComponent: () => import('../features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'devices',
    canActivate: [sessionGuard()],
    loadComponent: () => import('../features/devices/device-list/device-list.component').then(m => m.DeviceListComponent)
  },

  // Routes avec niveau de confiance spécifique
  {
    path: 'secure-area',
    canActivate: [sessionGuard('TRUSTED')], // Exige un appareil de confiance
    loadComponent: () => import('../features/secure/secure-area.component').then(m => m.SecureAreaComponent)
  },
  {
    path: 'highly-secure-area',
    canActivate: [sessionGuard('HIGHLY_TRUSTED')], // Exige un appareil hautement fiable
    loadComponent: () => import('../features/secure/highly-secure-area.component').then(m => m.HighlySecureAreaComponent)
  },


  // Pages de vérification et d'erreur
  {
    path: 'device-verification',
    loadComponent: () => import('../features/devices/device-verification/device-verification.component')
      .then(m => m.DeviceVerificationComponent)
  },
  {
    path: 'access-denied',
    loadComponent: () => import('../shared/components/access-denied/access-denied.component')
      .then(m => m.AccessDeniedComponent)
  },
  {
    path: 'error',
    loadComponent: () => import('../shared/components/error-page/error-page.component')
      .then(m => m.ErrorPageComponent)
  },
  {
    path: '**',
    loadComponent: () => import('../shared/components/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }*/
];
