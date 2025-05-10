import { Routes } from '@angular/router';
import { adminGuard } from '../../core/auth/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [() => adminGuard()],
    loadComponent: () => import('./dashboard/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent)
  },
  {
    path: 'users',
    canActivate: [adminGuard],
    loadComponent: () => import('./users/user-list/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'users/new',
    canActivate: [adminGuard],
    loadComponent: () => import('./users/user-register/user-register.component').then(m => m.UserRegisterComponent)
  },
  {
    path: 'users/:id',
    canActivate: [() => adminGuard()],
    loadComponent: () => import('./users/user-detail/user-detail.component')
      .then(m => m.UserDetailComponent)
  },
  {
    path: 'users/:id/devices',
    canActivate: [() => adminGuard()],
    loadComponent: () => import('../devices/device-list/device-list.component')
      .then(m => m.DeviceListComponent)
  }
];

