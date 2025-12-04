// src/app/features/auth/two-factor/two-factor-container/two-factor-container.component.ts

import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { AuthFacade } from '../../../../core/auth/services/auth.facade';
import {
  TwoFactorType,
  TwoFactorMethod,
  TwoFactorFlowState,
} from '../../../../core/auth';

import { MethodSelectorComponent } from '../components/method-selector/method-selector.component';
import { VerifyCodeComponent } from '../components/verify-code/verify-code.component';

/**
 * TwoFactorContainerComponent - Smart component orchestrating 2FA login flow.
 *
 * State machine:
 * - loading: Fetching available 2FA methods
 * - selecting: User choosing a method (when multiple available)
 * - verifying: User entering verification code
 * - success: Verification successful (brief, then redirect)
 * - error: Unrecoverable error
 *
 * Flow:
 * 1. On init, fetch available methods
 * 2. If single method → auto-select and go to verifying
 * 3. If multiple methods → show selector
 * 4. After method selection → show code input
 * 5. After verification → complete login (handled by AuthFacade)
 */
@Component({
  selector: 'app-two-factor-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MethodSelectorComponent,
    VerifyCodeComponent
  ],
  templateUrl: './two-factor-container.component.html',
  styleUrl: './two-factor-container.component.scss'
})
export class TwoFactorContainerComponent implements OnInit {

  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authFacade = inject(AuthFacade);

  // ===========================================================================
  // VIEW CHILDREN
  // ===========================================================================

  @ViewChild(VerifyCodeComponent) verifyCodeComponent!: VerifyCodeComponent;

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Current flow state */
  flowState = signal<TwoFactorFlowState>('loading');

  /** Available 2FA methods */
  availableMethods = signal<TwoFactorMethod[]>([]);

  /** Currently selected method */
  selectedMethod = signal<TwoFactorType | null>(null);

  /** Masked destination (email/phone) for display */
  maskedDestination = signal<string | undefined>(undefined);

  /** Error message to display */
  error = signal<string | null>(null);

  /** Loading/submitting state */
  isLoading = signal(false);

  /** Return URL after successful login */
  private returnUrl = '/';

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Load available methods
    this.loadAvailableMethods();
  }

  // ===========================================================================
  // FLOW METHODS
  // ===========================================================================

  /**
   * Load available 2FA methods for the current login session.
   */
  private loadAvailableMethods(): void {
    this.flowState.set('loading');
    this.error.set(null);

    this.authFacade.getAvailable2FAMethods().subscribe({
      next: (methods) => {
        this.availableMethods.set(methods);

        if (methods.length === 0) {
          this.flowState.set('error');
          this.error.set('No two-factor methods available. Please contact support.');
          return;
        }

        if (methods.length === 1) {
          // Auto-select single method
          this.selectMethod(methods[0].type);
        } else {
          // Show method selector
          this.flowState.set('selecting');
        }
      },
      error: (err) => {
        console.error('Failed to load 2FA methods:', err);
        this.flowState.set('error');
        this.error.set('Failed to load verification methods. Please try again.');
      }
    });
  }

  /**
   * Handle method selection from MethodSelectorComponent.
   */
  onMethodSelected(type: TwoFactorType): void {
    this.selectMethod(type);
  }

  /**
   * Select a 2FA method and initiate verification.
   */
  private selectMethod(type: TwoFactorType): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.selectedMethod.set(type);

    this.authFacade.choose2FAMethod(type).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.maskedDestination.set(response.maskedDestination);
        this.flowState.set('verifying');
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to select 2FA method:', err);
        this.error.set(err.error?.message || 'Failed to initiate verification. Please try again.');
        // Stay in current state to allow retry
      }
    });
  }

  /**
   * Handle code submission from VerifyCodeComponent.
   */
  onCodeSubmitted(code: string): void {
    const type = this.selectedMethod();
    if (!type) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.authFacade.verify2FAAndCompleteLogin(code, type, this.returnUrl).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.flowState.set('success');
        // Navigation is handled by AuthFacade
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err.message || err.error?.message || 'Invalid verification code';
        this.error.set(message);
        // Reset input for retry
        this.verifyCodeComponent?.resetInput();
        this.verifyCodeComponent?.focusInput();
      }
    });
  }

  /**
   * Handle resend request from VerifyCodeComponent.
   */
  onResendRequested(): void {
    this.authFacade.resend2FACode().subscribe({
      next: () => {
        this.verifyCodeComponent?.onResendComplete(true);
        this.error.set(null);
      },
      error: (err) => {
        this.verifyCodeComponent?.onResendComplete(false);
        this.error.set(err.error?.message || 'Failed to resend code. Please try again.');
      }
    });
  }

  /**
   * Go back to method selection (when multiple methods available).
   */
  onBackToSelection(): void {
    if (this.availableMethods().length > 1) {
      this.selectedMethod.set(null);
      this.maskedDestination.set(undefined);
      this.error.set(null);
      this.flowState.set('selecting');
    }
  }

  /**
   * Retry loading methods after error.
   */
  onRetry(): void {
    this.loadAvailableMethods();
  }

  /**
   * Cancel 2FA and return to login.
   */
  onCancel(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.returnUrl }
    });
  }

  // ===========================================================================
  // COMPUTED / HELPERS
  // ===========================================================================

  /**
   * Check if back button should be shown.
   */
  canGoBack(): boolean {
    return this.flowState() === 'verifying' && this.availableMethods().length > 1;
  }

  /**
   * Get the display name of the selected method.
   */
  getSelectedMethodName(): string {
    const type = this.selectedMethod();
    if (!type) return '';

    const method = this.availableMethods().find(m => m.type === type);
    return method?.displayName ?? type;
  }
}
