import { Routes } from '@angular/router';
import { adminGuard } from '../../core/auth/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [() => adminGuard()],
    loadComponent: () => import('./dashboard/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent)
  },
  /*
  {
    path: 'users',
    canActivate: [() => adminGuard()],
    loadComponent: () => import('./users/user-management/user-management.component')
      .then(m => m.UserManagementComponent)
  },
  {
    path: 'users/:id',
    canActivate: [() => adminGuard()],
    loadComponent: () => import('./users/user-detail/user-detail.component')
      .then(m => m.UserDetailComponent)
  },
  {
    path: 'users/create',
    canActivate: [() => adminGuard()],
    loadComponent: () => import('./users/user-form/user-form.component')
      .then(m => m.UserFormComponent)
  }
 */
];

