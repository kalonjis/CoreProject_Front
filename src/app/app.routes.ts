import { Routes } from '@angular/router';
import {authGuard} from './core/auth/guards/auth.guard';
import {adminGuard} from './core/auth/guards/admin.guard';

export const routes: Routes = [
  // Public routes
  // Authentication routes
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES)
  },
  /*{
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },


  // Protected routes
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'devices',
    canActivate: [authGuard],
    loadComponent: () => import('./features/devices/device-list/device-list.component').then(m => m.DeviceListComponent)
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(r => r.ADMIN_ROUTES)
  },

  // Error pages
  {
    path: 'access-denied',
    loadComponent: () => import('./shared/components/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }*/
];
