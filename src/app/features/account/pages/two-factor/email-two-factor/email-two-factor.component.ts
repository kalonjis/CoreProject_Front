// src/app/features/account/pages/two-factor/email-two-factor/email-two-factor.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';

import { TwoFactorApiService } from '../../../../../core/auth/services/two-factor-api.service';
import { AuthStore } from '../../../../../core/auth/state/auth.store';
import { TwoFactorMethod } from '../../../../../core/auth/models/two-factor.model';
import { ConfirmDialogService } from '../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { FeedbackService } from '../../../../../shared/feedback/tools/feedback.service';
import { EmailSetupModalComponent } from './components/email-setup-modal/email-setup-modal.component';

/**
 * Email Two-Factor Configuration Component.
 *
 * Dedicated page for managing Email 2FA:
 * - View current status
 * - Enable with verification flow
 * - Disable with confirmation
 *
 * Route: /account/security/two-factor/email
 */
@Component({
  selector: 'app-email-two-factor',
  standalone: true,
  imports: [CommonModule, EmailSetupModalComponent],
  templateUrl: './email-two-factor.component.html',
  styleUrl: './email-two-factor.component.scss'
})
export class EmailTwoFactorComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private twoFactorApi = inject(TwoFactorApiService);
  private authStore = inject(AuthStore);
  private confirmDialog = inject(ConfirmDialogService);
  private feedbackService = inject(FeedbackService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  emailMethod = signal<TwoFactorMethod | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  showSetupModal = signal(false);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.loadEmailMethodStatus();
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Load email 2FA method status.
   */
  private loadEmailMethodStatus(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.twoFactorApi.getSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to load 2FA settings', err);
          this.errorMessage.set('Failed to load email authentication status');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(methods => {
        const emailMethod = methods.find(m => m.type === 'EMAIL');
        this.emailMethod.set(emailMethod || null);
      });
  }

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  /**
   * Get masked email from current user session.
   */
  getMaskedEmail(): string {
    const user = this.authStore.user();
    if (!user?.email) return 'your email';

    const [local, domain] = user.email.split('@');
    if (!domain) return 'your email';

    const maskedLocal = local.charAt(0) + '***';
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Initiate email 2FA setup flow.
   */
  enableEmail(): void {
    this.confirmDialog.confirm({
      title: 'Enable Email Authentication',
      message: `A verification code will be sent to ${this.getMaskedEmail()}. Do you want to continue?`,
      confirmButtonText: 'Send Code',
      cancelButtonText: 'Cancel',
      type: 'info'
    })
      .then(() => {
        this.twoFactorApi.initiateEmailSetup()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.showSetupModal.set(true);
            },
            error: (err) => {
              console.error('Failed to initiate email 2FA setup', err);
              this.feedbackService.showError(
                err.error?.message || 'Failed to send verification code. Please try again.'
              );
            }
          });
      })
      .catch(() => {
        // User cancelled
      });
  }

  /**
   * Disable email 2FA with confirmation.
   */
  disableEmail(): void {
    this.confirmDialog.confirm({
      title: 'Disable Email Authentication',
      message: `Are you sure you want to disable two-factor authentication for ${this.getMaskedEmail()}? Your account will be less secure.`,
      confirmButtonText: 'Disable',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
      .then(() => {
        this.twoFactorApi.disableEmail()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.feedbackService.showSuccess('Email two-factor authentication has been disabled.');
              this.loadEmailMethodStatus();
            },
            error: (err) => {
              console.error('Failed to disable email 2FA', err);
              this.feedbackService.showError(
                err.error?.message || 'Failed to disable email authentication. Please try again.'
              );
            }
          });
      })
      .catch(() => {
        // User cancelled
      });
  }

  /**
   * Handle successful email setup completion.
   */
  onSetupComplete(): void {
    this.showSetupModal.set(false);
    this.feedbackService.showSuccess('Email two-factor authentication has been enabled successfully!');
    this.loadEmailMethodStatus();
  }

  /**
   * Handle setup modal cancellation.
   */
  onSetupCancel(): void {
    this.showSetupModal.set(false);
  }

  /**
   * Navigate back to 2FA overview.
   */
  goBack(): void {
    this.router.navigate(['/account/security/two-factor']);
  }

  /**
   * Retry loading.
   */
  retryLoading(): void {
    this.loadEmailMethodStatus();
  }
}
