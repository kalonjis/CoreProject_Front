// src/app/features/contact/contact.routes.ts

import { Routes } from '@angular/router';

export const CONTACT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/contact-page/contact-page.component')
      .then(m => m.ContactPageComponent),
    title: 'Contact'
  }
];
