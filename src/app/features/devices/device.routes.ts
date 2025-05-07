import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const DEVICE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [() => authGuard()],
    loadComponent: () => import('./device-list/device-list.component')
      .then(m => m.DeviceListComponent)
  }
];
