//
// Ajouter cette route dans le fichier existant des routes profile :

/*
  {
    path: 'addresses',
    loadChildren: () =>
      import('./addresses/profile-addresses.routes').then(m => m.PROFILE_ADDRESSES_ROUTES),
    // Optionnel: guard d'authentification
    // canActivate: [authGuard]
  }
*/

// Exemple de structure complète des routes profile :
//
// export const PROFILE_ROUTES: Routes = [
//   {
//     path: '',
//     component: ProfileLayoutComponent,
//     children: [
//       { path: '', redirectTo: 'overview', pathMatch: 'full' },
//       { path: 'overview', loadComponent: ... },
//       { path: 'settings', loadComponent: ... },
//       {
//         path: 'addresses',
//         loadChildren: () =>
//           import('./addresses/profile-addresses.routes').then(m => m.PROFILE_ADDRESSES_ROUTES)
//       },
//       // ... autres routes
//     ]
//   }
// ];
