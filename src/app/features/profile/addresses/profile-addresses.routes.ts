import { Routes } from '@angular/router';

export const PROFILE_ADDRESSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./profile-addresses/profile-addresses.component').then(m => m.ProfileAddressesComponent),
    title: 'Mes adresses'
  }
];
