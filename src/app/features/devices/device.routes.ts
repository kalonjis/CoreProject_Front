import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const DEVICE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [() => authGuard()],
    loadComponent: () => import('./device-management/device-management.component')
      .then(m => m.DeviceManagementComponent)
  },
  {
    path: 'list',
    canActivate: [() => authGuard()],
    redirectTo: ''
  }
];
