import { Routes } from '@angular/router';

export const ADMIN_USER_ADDRESSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-user-addresses/admin-user-addresses.component').then(m => m.AdminUserAddressesComponent),
    title: 'Adresses utilisateur - Admin'
  }
];
