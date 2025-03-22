/*import { Routes } from '@angular/router';
import {superAdminGuard} from '../../core/auth/guards/super-admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-list/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./users/user-details/user-details.component').then(m => m.UserDetailsComponent)
  },
  {
    path: 'users/create',
    loadComponent: () => import('./users/user-create/user-create.component').then(m => m.UserCreateComponent)
  },
  {
    // Special routes requiring SUPER_ADMIN
    path: 'system',
    canActivate: [superAdminGuard],
    loadComponent: () => import('./system/system-settings.component').then(m => m.SystemSettingsComponent)
  }
];*/
