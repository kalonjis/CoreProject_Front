import { Routes } from '@angular/router';
import { adminGuard } from '../../core/auth/guards/admin.guard';

/**
 * Admin module routes configuration.
 *
 * All routes are protected by adminGuard requiring ADMIN or SUPER_ADMIN role.
 * Components are lazy-loaded for optimal performance.
 *
 * Structure:
 * - /admin → Dashboard (module cards)
 * - /admin/users → Users container (stats + actions)
 *   - /admin/users/list → Full user list
 *   - /admin/users/new → Create user
 *   - /admin/users/:id → User details
 * - /admin/devices → Devices container (stats + actions)
 *   - /admin/devices/list → Full device list (coming soon)
 */
export const ADMIN_ROUTES: Routes = [
  // =========================================================================
  // DASHBOARD - Main entry point
  // =========================================================================
  {
    path: '',
    canActivate: [() => adminGuard()],
    loadComponent: () => import('./dashboard/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent)
  },

  // =========================================================================
  // USERS MODULE
  // =========================================================================
  {
    path: 'users',
    canActivate: [adminGuard],
    children: [
      // Users container (landing page)
      {
        path: '',
        loadComponent: () => import('./users/users-container/users-container.component')
          .then(m => m.UsersContainerComponent)
      },
      // User list (full list view)
      {
        path: 'list',
        loadComponent: () => import('./users/user-list/user-list.component')
          .then(m => m.UserListComponent)
      },
      // Create new user
      {
        path: 'new',
        loadComponent: () => import('./users/user-register/user-register.component')
          .then(m => m.UserRegisterComponent)
      },
      // User details
      {
        path: ':id',
        loadComponent: () => import('./users/user-detail/user-detail.component')
          .then(m => m.UserDetailComponent)
      }
    ]
  },

  // =========================================================================
  // DEVICES MODULE
  // =========================================================================
  {
    path: 'devices',
    canActivate: [adminGuard],
    children: [
      // Devices container (landing page)
      {
        path: '',
        loadComponent: () => import('./devices/devices-container/devices-container.component')
          .then(m => m.DevicesContainerComponent)
      },
      // Device list (coming soon - placeholder for now)
      {
        path: 'list',
        loadComponent: () => import('./devices/devices-container/devices-container.component')
          .then(m => m.DevicesContainerComponent)
        // TODO: Create dedicated device-list component
      }
      // Device details route will be added when device detail component is ready
      // {
      //   path: ':id',
      //   loadComponent: () => import('./devices/device-detail/device-detail.component')
      //     .then(m => m.DeviceDetailComponent)
      // }
    ]
  },

  // =========================================================================
  // FUTURE MODULES (Placeholder routes)
  // =========================================================================
  // Uncomment and implement when modules are ready

  // {
  //   path: 'suppliers',
  //   canActivate: [adminGuard],
  //   loadComponent: () => import('./suppliers/suppliers-container/suppliers-container.component')
  //     .then(m => m.SuppliersContainerComponent)
  // },

  // {
  //   path: 'products',
  //   canActivate: [adminGuard],
  //   loadComponent: () => import('./products/products-container/products-container.component')
  //     .then(m => m.ProductsContainerComponent)
  // },

  // {
  //   path: 'clients',
  //   canActivate: [adminGuard],
  //   loadComponent: () => import('./clients/clients-container/clients-container.component')
  //     .then(m => m.ClientsContainerComponent)
  // },

  // {
  //   path: 'settings',
  //   canActivate: [adminGuard],
  //   loadComponent: () => import('./settings/settings-container/settings-container.component')
  //     .then(m => m.SettingsContainerComponent)
  // },

  // =========================================================================
  // FALLBACK - Redirect unknown paths to dashboard
  // =========================================================================
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
