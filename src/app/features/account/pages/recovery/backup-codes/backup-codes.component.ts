// src/app/features/account/pages/recovery/backup-codes/backup-codes.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';

import { AuthFacade } from '../../../../../core/auth/services/auth.facade';
import { AuthStore } from '../../../../../core/auth/state/auth.store';
import { TwoFactorMethod, BackupCodesSetupResponse } from '../../../../../core/auth/models/two-factor.model';
import { ConfirmDialogService } from '../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { FeedbackService } from '../../../../../shared/feedback/tools/feedback.service';
import { BackupCodesModalComponent } from './components/backup-codes-modal/backup-codes-modal.component';

/**
 * Backup Codes Configuration Component.
 *
 * Dedicated page for managing backup recovery codes:
 * - View current status
 * - Generate backup codes with secure display
 * - Regenerate codes when needed
 * - Disable backup codes
 *
 * Route: /account/security/recovery/backup-codes
 */
@Component({
  selector: 'app-backup-codes',
  standalone: true,
  imports: [CommonModule, BackupCodesModalComponent],
  templateUrl: './backup-codes.component.html',
  styleUrl: './backup-codes.component.scss'
})
export class BackupCodesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private authFacade = inject(AuthFacade);
  private authStore = inject(AuthStore);
  private confirmDialog = inject(ConfirmDialogService);
  private feedbackService = inject(FeedbackService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Backup codes method configuration and status */
  backupCodesMethod = signal<TwoFactorMethod | null>(null);

  /** All 2FA methods (to check if user has primary 2FA) */
  twoFactorMethods = signal<TwoFactorMethod[]>([]);

  /** Loading state for initial data fetch */
  isLoading = signal(true);

  /** Loading state for operations */
  isOperating = signal(false);

  /** Error message to display */
  errorMessage = signal<string | null>(null);

  /** Whether to show the backup codes modal */
  showCodesModal = signal(false);

  /** Generated backup codes for display */
  generatedCodes = signal<string[]>([]);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.loadBackupCodesStatus();
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Load backup codes status and all 2FA methods.
   */
  private loadBackupCodesStatus(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authFacade.loadTwoFactorSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to load 2FA settings', err);
          this.errorMessage.set('Failed to load backup codes status');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(methods => {
        this.twoFactorMethods.set(methods);
        const backupMethod = methods.find(m => m.type === 'BACKUP_CODES');
        this.backupCodesMethod.set(backupMethod || null);
      });
  }

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  /**
   * Check if user has primary 2FA enabled.
   */
  hasPrimary2FA(): boolean {
    return this.twoFactorMethods().some(m =>
      m.isEnabled && m.type !== 'BACKUP_CODES'
    );
  }

  /**
   * Get user display name.
   */
  getUserDisplayName(): string {
    const user = this.authStore.user();
    return user?.username || 'your account';
  }

  /**
   * Get primary 2FA methods count.
   */
  getPrimary2FACount(): number {
    return this.twoFactorMethods().filter(m =>
      m.isEnabled && m.type !== 'BACKUP_CODES'
    ).length;
  }

  /**
   * Enable backup codes and generate new codes.
   */
  enableBackupCodes(): void {
    if (!this.hasPrimary2FA()) {
      this.feedbackService.showError('Two-factor authentication must be enabled first');
      return;
    }

    this.confirmDialog.confirm({
      title: 'Generate Backup Codes',
      message: `This will generate 10 single-use backup codes for ${this.getUserDisplayName()}. Store them securely - they will only be shown once!`,
      confirmButtonText: 'Generate Codes',
      cancelButtonText: 'Cancel',
      type: 'info'
    })
      .then(() => {
        this.generateBackupCodes();
      })
      .catch(() => {
        // User cancelled
      });
  }

  /**
   * Regenerate backup codes (replace existing ones).
   */
  regenerateBackupCodes(): void {
    this.confirmDialog.confirm({
      title: 'Regenerate Backup Codes',
      message: `This will invalidate your current backup codes and generate new ones for ${this.getUserDisplayName()}. Any unused codes will no longer work. Continue?`,
      confirmButtonText: 'Regenerate',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
      .then(() => {
        this.generateBackupCodes();
      })
      .catch(() => {
        // User cancelled
      });
  }

  /**
   * Disable backup codes.
   */
  disableBackupCodes(): void {
    this.confirmDialog.confirm({
      title: 'Disable Backup Codes',
      message: `Are you sure you want to disable backup codes for ${this.getUserDisplayName()}? You will lose this recovery method for your account.`,
      confirmButtonText: 'Disable',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
      .then(() => {
        this.isOperating.set(true);

        this.authFacade.disableTwoFactorMethod('BACKUP_CODES')
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(err => {
              console.error('Failed to disable backup codes', err);
              this.feedbackService.showError('Failed to disable backup codes. Please try again.');
              return of(null);
            }),
            finalize(() => this.isOperating.set(false))
          )
          .subscribe(response => {
            if (response) {
              this.feedbackService.showSuccess('Backup codes have been disabled.');
              this.loadBackupCodesStatus();
            }
          });
      })
      .catch(() => {
        // User cancelled
      });
  }

  /**
   * Handle backup codes modal completion.
   */
  onCodesModalComplete(): void {
    this.showCodesModal.set(false);
    this.generatedCodes.set([]);
    this.feedbackService.showSuccess('Backup codes have been enabled successfully!');
    this.loadBackupCodesStatus();
  }

  /**
   * Handle backup codes modal cancellation.
   */
  onCodesModalCancel(): void {
    this.showCodesModal.set(false);
    this.generatedCodes.set([]);
  }

  /**
   * Navigate back to recovery overview.
   */
  goBack(): void {
    this.router.navigate(['/account/security/recovery']);
  }

  /**
   * Retry loading backup codes status.
   */
  retryLoading(): void {
    this.loadBackupCodesStatus();
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Generate backup codes via API and show modal.
   */
  private generateBackupCodes(): void {
    this.isOperating.set(true);

    this.authFacade.enableTwoFactorMethod('BACKUP_CODES')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to generate backup codes', err);
          this.feedbackService.showError('Failed to generate backup codes. Please try again.');
          return of(null);
        }),
        finalize(() => this.isOperating.set(false))
      )
      .subscribe(response => {
        if (response) {
          const backupResponse = response as BackupCodesSetupResponse;
          if (backupResponse.backupCodes) {
            this.generatedCodes.set(backupResponse.backupCodes);
            this.showCodesModal.set(true);
          }
        }
      });
  }
}
