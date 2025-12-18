// src/app/features/account/pages/two-factor/totp-two-factor/totp-two-factor.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';

import { TwoFactorApiService } from '../../../../../core/auth/services/two-factor-api.service';
import { AuthStore } from '../../../../../core/auth/state/auth.store';
import { TwoFactorMethod } from '../../../../../core/auth/models/two-factor.model';
import { ConfirmDialogService } from '../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { FeedbackService } from '../../../../../shared/feedback/tools/feedback.service';
import { TotpSetupModalComponent } from './components/totp-setup-modal/totp-setup-modal.component';

/**
 * TOTP Two-Factor Authentication Configuration Component.
 *
 * Dedicated page for managing TOTP (Time-based One-Time Password) 2FA:
 * - View current status (enabled/disabled)
 * - Enable with QR code setup and verification flow
 * - Disable with confirmation dialog
 * - Manage authenticator app configuration
 *
 * Features:
 * - QR code generation for easy setup
 * - Support for popular authenticator apps (Google, Microsoft, Authy, etc.)
 * - Secret key backup display
 * - Test code verification before activation
 *
 * Route: /account/security/two-factor/totp
 */
@Component({
  selector: 'app-totp-two-factor',
  standalone: true,
  imports: [CommonModule, TotpSetupModalComponent],
  templateUrl: './totp-two-factor.component.html',
  styleUrl: './totp-two-factor.component.scss'
})
export class TotpTwoFactorComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private twoFactorApi = inject(TwoFactorApiService);
  private authStore = inject(AuthStore);
  private confirmDialog = inject(ConfirmDialogService);
  private feedbackService = inject(FeedbackService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** TOTP method configuration and status */
  totpMethod = signal<TwoFactorMethod | null>(null);

  /** Loading state for initial data fetch */
  isLoading = signal(true);

  /** Error message to display */
  errorMessage = signal<string | null>(null);

  /** Whether to show the TOTP setup modal */
  showSetupModal = signal(false);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.loadTotpMethodStatus();
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Load TOTP 2FA method status from backend.
   * Fetches current configuration and availability.
   */
  private loadTotpMethodStatus(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.twoFactorApi.getSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to load 2FA settings', err);
          this.errorMessage.set('Failed to load TOTP authentication status');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((methods: TwoFactorMethod[]) => {
        const totpMethod = methods.find(m => m.type === 'TOTP');
        this.totpMethod.set(totpMethod || null);
      });
  }

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  /**
   * Get current user information for display.
   * Returns the username or fallback text for TOTP identification.
   */
  getUserDisplayName(): string {
    const user = this.authStore.user();
    return user?.username || 'your account';
  }

  /**
   * Initiate TOTP 2FA setup flow.
   * Shows confirmation dialog then opens setup modal with QR code.
   */
  enableTotp(): void {
    this.confirmDialog.confirm({
      title: 'Enable Authenticator App',
      message: `Set up time-based codes with your authenticator app for ${this.getUserDisplayName()}. You'll need to scan a QR code.`,
      confirmButtonText: 'Setup Now',
      cancelButtonText: 'Cancel',
      type: 'info'
    })
      .then(() => {
        // User confirmed - open setup modal
        this.showSetupModal.set(true);
      })
      .catch(() => {
        // User cancelled - do nothing
      });
  }

  /**
   * Disable TOTP 2FA with confirmation dialog.
   * Removes authenticator app configuration after user confirms.
   */
  disableTotp(): void {
    this.confirmDialog.confirm({
      title: 'Disable Authenticator App',
      message: `Are you sure you want to disable TOTP authentication for ${this.getUserDisplayName()}? Your account will be less secure.`,
      confirmButtonText: 'Disable',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
      .then(() => {
        this.twoFactorApi.disableTotp()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.feedbackService.showSuccess('TOTP authentication has been disabled.');
              this.loadTotpMethodStatus();
            },
            error: (err: HttpErrorResponse) => {
              console.error('Failed to disable TOTP 2FA', err);
              this.feedbackService.showError(
                err.error?.message || 'Failed to disable TOTP authentication. Please try again.'
              );
            }
          });
      })
      .catch(() => {
        // User cancelled
      });
  }

  /**
   * Handle successful TOTP setup completion.
   * Called when user successfully verifies their authenticator app.
   */
  onSetupComplete(): void {
    this.showSetupModal.set(false);
    this.feedbackService.showSuccess('TOTP authentication has been enabled successfully!');
    this.loadTotpMethodStatus();
  }

  /**
   * Handle TOTP setup modal cancellation.
   * Called when user closes modal without completing setup.
   */
  onSetupCancel(): void {
    this.showSetupModal.set(false);
  }

  /**
   * Navigate back to 2FA methods overview.
   */
  goBack(): void {
    this.router.navigate(['/account/security/two-factor']);
  }

  /**
   * Retry loading TOTP status after error.
   */
  retryLoading(): void {
    this.loadTotpMethodStatus();
  }
}
