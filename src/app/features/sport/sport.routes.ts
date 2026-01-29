// src/app/features/sport/sport.routes.ts

import { Routes } from '@angular/router';

export const SPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/sport-dashboard/sport-dashboard.component')
        .then(m => m.SportDashboardComponent),
    title: 'Mes activités'
  },
  {
    path: ':publicId',
    loadComponent: () =>
      import('./pages/sport-track-view/sport-track-view.component')
        .then(m => m.SportTrackViewComponent),
    title: 'Détail activité'
  }

];
