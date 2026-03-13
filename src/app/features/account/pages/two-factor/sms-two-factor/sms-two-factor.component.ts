// src/app/features/account/pages/two-factor/sms-two-factor/sms-two-factor.component.ts

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
import { SmsSetupModalComponent } from './components/sms-setup-modal/sms-setup-modal.component';

/**
 * SMS Two-Factor Authentication Configuration Component.
 *
 * Dedicated page for managing SMS-based 2FA:
 * - View current status (enabled/disabled)
 * - Enable with phone verification flow
 * - Disable with confirmation dialog
 *
 * Prerequisites:
 * - User must have a verified phone number to enable SMS 2FA
 *
 * Route: /account/security/two-factor/sms
 *
 * @example
 * ```typescript
 * // In routing module
 * { path: 'sms', component: SmsTwoFactorComponent }
 * ```
 */
@Component({
    selector: 'app-sms-two-factor',
    imports: [CommonModule, SmsSetupModalComponent],
    templateUrl: './sms-two-factor.component.html',
    styleUrl: './sms-two-factor.component.scss'
})
export class SmsTwoFactorComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private twoFactorApi = inject(TwoFactorApiService);
  private authStore = inject(AuthStore);
  private confirmDialog = inject(ConfirmDialogService);
  private feedbackService = inject(FeedbackService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Current SMS 2FA method configuration */
  smsMethod = signal<TwoFactorMethod | null>(null);

  /** Loading state for initial data fetch */
  isLoading = signal(true);

  /** Error message for display */
  errorMessage = signal<string | null>(null);

  /** Controls visibility of the setup modal */
  showSetupModal = signal(false);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.loadSmsMethodStatus();
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Load SMS 2FA method status from backend.
   * Filters the settings response to find SMS configuration.
   */
  private loadSmsMethodStatus(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.twoFactorApi.getSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to load 2FA settings', err);
          this.errorMessage.set('Failed to load SMS authentication status');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(methods => {
        const smsMethod = methods.find(m => m.type === 'SMS');
        this.smsMethod.set(smsMethod || null);
      });
  }

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  /**
   * Get masked phone number from current user session.
   * Masks the middle digits for privacy.
   *
   * @returns Masked phone number string (e.g., "+32 4** ** ** 90")
   */
  getMaskedPhone(): string {
    const user = this.authStore.user();
    if (!user?.phoneNumber) return 'your phone';

    const phone = user.phoneNumber;
    // Keep first 4 and last 2 characters visible
    if (phone.length <= 6) return phone;

    const visible = phone.slice(0, 4) + '****' + phone.slice(-2);
    return visible;
  }

  /**
   * Check if user has a verified phone number.
   * Required before enabling SMS 2FA.
   *
   * @returns True if phone number is verified
   */
  hasVerifiedPhone(): boolean {
    const user = this.authStore.user();
    return !!(user?.phoneNumber && user?.phoneNumberVerified);
  }

  /**
   * Initiate SMS 2FA setup flow.
   * Shows confirmation dialog, then initiates the setup and opens modal.
   */
  enableSms(): void {
    // Check prerequisites
    if (!this.hasVerifiedPhone()) {
      this.feedbackService.showError(
        'You need to verify your phone number before enabling SMS authentication. ' +
        'Go to Profile to add and verify your phone number.'
      );
      return;
    }

    this.confirmDialog.confirm({
      title: 'Enable SMS Authentication',
      message: `A verification code will be sent to ${this.getMaskedPhone()}. Do you want to continue?`,
      confirmButtonText: 'Send Code',
      cancelButtonText: 'Cancel',
      type: 'info'
    })
      .then(() => {
        this.twoFactorApi.initiateSmsSetup()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.showSetupModal.set(true);
            },
            error: (err) => {
              console.error('Failed to initiate SMS 2FA setup', err);
              this.feedbackService.showError(
                err.error?.message || 'Failed to send verification code. Please try again.'
              );
            }
          });
      })
      .catch(() => {
        // User cancelled confirmation dialog
      });
  }

  /**
   * Disable SMS 2FA with confirmation.
   * Shows warning dialog before disabling.
   */
  disableSms(): void {
    this.confirmDialog.confirm({
      title: 'Disable SMS Authentication',
      message: `Are you sure you want to disable two-factor authentication for ${this.getMaskedPhone()}? Your account will be less secure.`,
      confirmButtonText: 'Disable',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
      .then(() => {
        this.twoFactorApi.disableSms()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.feedbackService.showSuccess('SMS two-factor authentication has been disabled.');
              this.loadSmsMethodStatus();
            },
            error: (err) => {
              console.error('Failed to disable SMS 2FA', err);
              this.feedbackService.showError(
                err.error?.message || 'Failed to disable SMS authentication. Please try again.'
              );
            }
          });
      })
      .catch(() => {
        // User cancelled confirmation dialog
      });
  }

  /**
   * Handle successful SMS setup completion from modal.
   * Closes modal, shows success message, and reloads status.
   */
  onSetupComplete(): void {
    this.showSetupModal.set(false);
    this.feedbackService.showSuccess('SMS two-factor authentication has been enabled successfully!');
    this.loadSmsMethodStatus();
  }

  /**
   * Handle setup modal cancellation.
   * Simply closes the modal.
   */
  onSetupCancel(): void {
    this.showSetupModal.set(false);
  }

  /**
   * Navigate back to 2FA overview page.
   */
  goBack(): void {
    this.router.navigate(['/account/security/two-factor']);
  }

  /**
   * Retry loading SMS method status.
   * Used when initial load fails.
   */
  retryLoading(): void {
    this.loadSmsMethodStatus();
  }
}
