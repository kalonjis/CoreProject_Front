// src/app/features/account/components/security-tab/components/two-factor-section/two-factor-section.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';

import { AuthFacade } from '../../../../../../core/auth/services/auth.facade';
import {
  TwoFactorType,
  TwoFactorMethod
} from '../../../../../../core/auth/models/two-factor.model';
import { MethodsOverviewComponent } from './components/methods-overview/methods-overview.component';
import { TotpDetailComponent } from './components/totp-detail/totp-detail.component';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { EmailSetupModalComponent } from '../../../../pages/two-factor/email-two-factor/components/email-setup-modal/email-setup-modal.component';
import {AuthStore} from '../../../../../../core/auth';

/**
 * Two-Factor Authentication section container.
 *
 * Manages 2FA methods state and navigation between overview and detail views.
 *
 * Views:
 * - overview: List of all 2FA methods with status
 * - detail: Detailed configuration for selected method
 */
@Component({
  selector: 'app-two-factor-section',
  standalone: true,
  imports: [CommonModule, MethodsOverviewComponent, EmailSetupModalComponent, TotpDetailComponent],
  templateUrl: './two-factor-section.component.html',
  styleUrl: './two-factor-section.component.scss'
})
export class TwoFactorSectionComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authFacade = inject(AuthFacade);
  private authStore = inject(AuthStore);
  private confirmDialogService = inject(ConfirmDialogService);
  private confirmDialog = inject(ConfirmDialogService);
  private feedbackService = inject(FeedbackService);

  // Navigation state
  currentView = signal<'overview' | 'detail'>('overview');
  selectedMethod = signal<TwoFactorMethod | null>(null);

  // Two-Factor Authentication state
  twoFactorMethods = signal<TwoFactorMethod[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  // Email setup modal state
  showEmailSetupModal = signal(false);

  ngOnInit(): void {
    this.loadTwoFactorMethods();
  }

  /**
   * Load user's two-factor authentication methods.
   */
  private loadTwoFactorMethods(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authFacade.loadTwoFactorSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to load 2FA methods', err);
          this.errorMessage.set('Failed to load two-factor authentication settings');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(methods => this.twoFactorMethods.set(methods));
  }

  /**
   * Get icon for 2FA method type.
   */
  getMethodIcon(type: TwoFactorType): string {
    const icons: Record<TwoFactorType, string> = {
      EMAIL: '📧',
      SMS: '📱',
      TOTP: '🔐',
      BACKUP_CODES: '🗝️',
      WEBAUTHN: '🔑'
    };
    return icons[type];
  }


  /**
   * Get masked email from current user session.
   * Example: "john.doe@example.com" → "j***@example.com"
   */
  private getMaskedEmail(): string {
    const user = this.authStore.user();
    if (!user?.email) return 'your email';

    const [local, domain] = user.email.split('@');
    if (!domain) return 'your email';

    const maskedLocal = local.charAt(0) + '***';
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Get enabled 2FA methods count.
   */
  getEnabledMethodsCount(): number {
    return this.twoFactorMethods().filter(method => method.isEnabled).length;
  }

  /**
   * Navigate to method detail view.
   */
  showMethodDetail(method: TwoFactorMethod): void {
    this.selectedMethod.set(method);
    this.currentView.set('detail');
  }

  /**
   * Navigate back to overview.
   */
  showOverview(): void {
    this.currentView.set('overview');
    this.selectedMethod.set(null);
  }

  /**
   * Handle enabling a 2FA method.
   * For EMAIL: Uses two-step flow with confirmation dialog then verification modal.
   * For other types: Direct enable (to be implemented).
   */
  enableMethod(method: TwoFactorMethod): void {
    if (method.type === 'EMAIL') {
      this.initiateEmailSetup();
    } else {
      // TODO: Implement enable logic for other 2FA types
      console.log('Enable method:', method.type);
      this.showMethodDetail(method);
    }
  }

  /**
   * Initiate Email 2FA setup flow.
   * Step 1: Show confirmation dialog
   * Step 2: Call initiate endpoint
   * Step 3: Show verification modal
   */
  private initiateEmailSetup(): void {
    const maskedEmail = this.getMaskedEmail();

    this.confirmDialog.confirm({
      title: 'Enable Email Authentication',
      message: `A verification code will be sent to your ${maskedEmail} address. Do you want to continue?`,
      confirmButtonText: 'Send Code',
      cancelButtonText: 'Cancel',
      type: 'info'
    })
      .then(() => {
        // User confirmed - call initiate endpoint
        this.authFacade.initiateEmailTwoFactorSetup()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              // Success - show verification modal
              this.showEmailSetupModal.set(true);
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
        // User cancelled - do nothing
      });
  }

  /**
   * Handle successful email 2FA setup completion.
   */
  onEmailSetupComplete(): void {
    this.showEmailSetupModal.set(false);
    this.feedbackService.showSuccess('Email two-factor authentication has been enabled successfully!');

    // Refresh the methods list to show updated status
    this.loadTwoFactorMethods();

    // Navigate back to overview
    this.showOverview();
  }

  /**
   * Handle email setup modal cancellation.
   */
  onEmailSetupCancel(): void {
    this.showEmailSetupModal.set(false);
  }

  /**
   * Handle disabling a 2FA method.
   * Shows confirmation dialog then calls disable endpoint.
   */
  disableMethod(method: TwoFactorMethod): void {
    if (method.type === 'EMAIL') {
      this.disableEmailTwoFactor();
    } else {
      // TODO: Implement disable logic for other 2FA types
      console.log('Disable method:', method.type);
    }
  }

  /**
   * Disable Email 2FA with confirmation.
   */
  private disableEmailTwoFactor(): void {
    const maskedEmail = this.getMaskedEmail();

    this.confirmDialog.confirm({
      title: 'Disable Email Authentication',
      message: `Are you sure you want to disable two-factor authentication for ${maskedEmail}? Your account will be less secure.`,
      confirmButtonText: 'Disable',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
      .then(() => {
        // User confirmed - call disable endpoint
        this.authFacade.disableTwoFactorMethod('EMAIL')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.feedbackService.showSuccess('Email two-factor authentication has been disabled.');
              this.loadTwoFactorMethods();
              this.showOverview();
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
        // User cancelled - do nothing
      });
  }

  /**
   * Perform the actual enable method API call.
   */
  private performEnableMethod(method: TwoFactorMethod): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authFacade.enableTwoFactorMethod(method.type)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to enable method', err);
          this.errorMessage.set(`Failed to enable ${method.displayName}. Please try again.`);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(response => {
        if (response) {
          this.loadTwoFactorMethods(); // Reload to get updated status
        }
      });
  }

  /**
   * Perform the actual disable method API call.
   */
  private performDisableMethod(method: TwoFactorMethod): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authFacade.disableTwoFactorMethod(method.type)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to disable method', err);
          this.errorMessage.set(`Failed to disable ${method.displayName}. Please try again.`);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(response => {
        if (response) {
          this.loadTwoFactorMethods(); // Reload to get updated status
          this.showOverview(); // Return to overview after disable
        }
      });
  }

  /**
   * Handle method updated event from detail components.
   * Reloads the methods list to reflect changes.
   */
  onMethodUpdated(): void {
    this.loadTwoFactorMethods();
  }

  /**
   * Handle enable request from detail components.
   */
  onEnableRequested(method: TwoFactorMethod): void {
    this.enableMethod(method);
  }

  /**
   * Handle disable request from detail components.
   */
  onDisableRequested(method: TwoFactorMethod): void {
    this.disableMethod(method);
  }

  /**
   * Retry loading 2FA settings.
   */
  retryLoading(): void {
    this.loadTwoFactorMethods();
  }
}
