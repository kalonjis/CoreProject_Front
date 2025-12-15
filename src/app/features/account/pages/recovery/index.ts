// src/app/features/account/pages/recovery/index.ts

/**
 * Recovery Options Pages Module
 *
 * Public API for the recovery options configuration pages.
 * Dedicated pages for each recovery method configuration.
 */

// Overview page
export { RecoveryOverviewComponent } from './recovery-overview/recovery-overview.component';

// Method configuration pages
export { BackupCodesComponent } from './backup-codes/backup-codes.component';

// Modals and components
export { BackupCodesModalComponent } from './backup-codes/components/backup-codes-modal/backup-codes-modal.component';

// Routes
export { RECOVERY_ROUTES } from './recovery.routes';
