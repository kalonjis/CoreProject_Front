// src/app/features/account/pages/recovery/recovery.recovery.routes.ts

import { Routes } from '@angular/router';

export const RECOVERY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./recovery-overview/recovery-overview.component')
      .then(m => m.RecoveryOverviewComponent)
  },
  {
    path: 'backup-codes',
    loadComponent: () => import('./backup-codes/backup-codes.component')
      .then(m => m.BackupCodesComponent)
  }
  // Future routes:
  // {
  //   path: 'recovery-email',
  //   loadComponent: () => import('./recovery-email/recovery-email.component')
  //     .then(m => m.RecoveryEmailComponent)
  // },
  // {
  //   path: 'recovery-phone',
  //   loadComponent: () => import('./recovery-phone/recovery-phone.component')
  //     .then(m => m.RecoveryPhoneComponent)
  // }
];
