import { Routes } from '@angular/router';

// ✅ AVANT:
// import { authGuard } from '../core/auth/guards/auth.guard';
// import { adminGuard } from '../core/auth/guards/admin.guard';

// ✅ APRÈS: Import depuis le barrel
import { authGuard, roleGuard } from '../core/auth';

export const routes: Routes = [
  // Public routes
  {
    path: 'auth',
    loadChildren: () => import('../features/auth/auth.routes').then(r => r.AUTH_ROUTES)
  },
  {
    path: '',
    loadComponent: () => import('../features/home/home.component').then(m => m.HomeComponent)
  },

  // Authenticated routes
  {
    path: 'profile',
    canActivate: [() => authGuard()],
    loadComponent: () => import('../features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'devices',
    canActivate: [() => authGuard()],
    loadChildren: () => import('../features/devices/device.routes').then(r => r.DEVICE_ROUTES)
  },

  // ✅ AVANT: canActivate: [adminGuard]
  // ✅ APRÈS: Utilise roleGuard
  {
    path: 'admin',
    canActivate: [() => roleGuard(['ADMIN', 'SUPER_ADMIN'])],
    loadChildren: () => import('../features/admin/admin.routes').then(r => r.ADMIN_ROUTES)
  }
];
