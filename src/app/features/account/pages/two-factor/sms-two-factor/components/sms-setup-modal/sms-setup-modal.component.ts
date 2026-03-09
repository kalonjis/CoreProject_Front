// src/app/features/account/pages/two-factor/sms-two-factor/components/sms-setup-modal/sms-setup-modal.component.ts

import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { VerifyCodeComponent } from '../../../../../../auth/two-factor/components/verify-code/verify-code.component';
import { TwoFactorApiService } from '../../../../../../../core/auth/services/two-factor-api.service';

/**
 * SMS 2FA Setup Modal Component.
 *
 * Displays a modal overlay for the SMS 2FA verification flow.
 * Uses the shared VerifyCodeComponent for code input.
 *
 * Flow:
 * 1. Modal opens after initiate was called (code already sent via SMS)
 * 2. User enters the 6-digit code received on their phone
 * 3. On submit: verify and activate SMS 2FA
 * 4. On success: emit event and close
 *
 * Resend: re-calls initiate endpoint (generates and sends new code)
 *
 * @example
 * ```html
 * <app-sms-setup-modal
 *   [maskedPhone]="'+32 4** ** ** 90'"
 *   (setupComplete)="onSetupComplete()"
 *   (cancel)="onCancel()">
 * </app-sms-setup-modal>
 * ```
 */
@Component({
    selector: 'app-sms-setup-modal',
    imports: [CommonModule, VerifyCodeComponent],
    templateUrl: './sms-setup-modal.component.html',
    styleUrl: './sms-setup-modal.component.scss'
})
export class SmsSetupModalComponent implements OnInit {
  private twoFactorApi = inject(TwoFactorApiService);

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** User's masked phone number for display (e.g., "+32 4** ** ** 90") */
  @Input() maskedPhone?: string;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  /** Emitted when setup is successfully completed */
  @Output() setupComplete = new EventEmitter<void>();

  /** Emitted when user cancels/closes the modal */
  @Output() cancel = new EventEmitter<void>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Whether a verification request is in progress */
  isSubmitting = signal(false);

  /** Whether resend is in progress */
  isResending = signal(false);

  /** Error message to display */
  error = signal<string | null>(null);

  /** Success message after resend */
  resendSuccess = signal(false);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    // Modal opens after initiate was already called
    // Code has been sent via SMS, user just needs to enter it
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Handle code submission from VerifyCodeComponent.
   * Calls the verify endpoint to complete SMS 2FA activation.
   *
   * @param code - The 6-digit verification code entered by user
   */
  onCodeSubmitted(code: string): void {
    this.isSubmitting.set(true);
    this.error.set(null);
    this.resendSuccess.set(false);

    this.twoFactorApi.verifySmsSetup(code).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.setupComplete.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(
          err.error?.message || 'Invalid verification code. Please try again.'
        );
      }
    });
  }

  /**
   * Handle resend request from VerifyCodeComponent.
   * Re-calls the initiate endpoint to generate and send a new code.
   */
  onResendRequested(): void {
    this.isResending.set(true);
    this.error.set(null);
    this.resendSuccess.set(false);

    this.twoFactorApi.initiateSmsSetup().subscribe({
      next: () => {
        this.isResending.set(false);
        this.resendSuccess.set(true);
        // Auto-hide success message after 3 seconds
        setTimeout(() => this.resendSuccess.set(false), 3000);
      },
      error: (err) => {
        this.isResending.set(false);
        this.error.set(
          err.error?.message || 'Failed to resend verification code. Please try again.'
        );
      }
    });
  }

  /**
   * Handle cancel button click.
   * Emits cancel event to parent component.
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Prevent modal close when clicking inside modal content.
   *
   * @param event - The click event
   */
  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}
