// src/app/features/account/pages/two-factor/email-two-factor/components/email-setup-modal/email-setup-modal.component.ts

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
 * Email 2FA Setup Modal Component.
 *
 * Displays a modal overlay for the email 2FA verification flow.
 * Uses the shared VerifyCodeComponent for code input.
 *
 * Flow:
 * 1. Modal opens after initiate was called (code already sent)
 * 2. User enters the 6-digit code
 * 3. On submit: verify and activate
 * 4. On success: emit event and close
 *
 * Resend: re-calls initiate endpoint (generates new code)
 */
@Component({
  selector: 'app-email-setup-modal',
  standalone: true,
  imports: [CommonModule, VerifyCodeComponent],
  templateUrl: './email-setup-modal.component.html',
  styleUrl: './email-setup-modal.component.scss'
})
export class EmailSetupModalComponent implements OnInit {
  private twoFactorApi = inject(TwoFactorApiService);

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** User's masked email for display (e.g., "j***@mail.com") */
  @Input() maskedEmail?: string;

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

  /** Whether a request is in progress */
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
    // Code has been sent, user just needs to enter it
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Handle code submission from VerifyCodeComponent.
   * Calls the verify endpoint to complete activation.
   */
  onCodeSubmitted(code: string): void {
    this.isSubmitting.set(true);
    this.error.set(null);
    this.resendSuccess.set(false);

    this.twoFactorApi.verifyEmailSetup(code).subscribe({
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
   * Handle resend request.
   * Re-calls initiate endpoint to generate and send a new code.
   */
  onResendRequested(): void {
    this.isResending.set(true);
    this.error.set(null);
    this.resendSuccess.set(false);

    this.twoFactorApi.initiateEmailSetup().subscribe({
      next: () => {
        this.isResending.set(false);
        this.resendSuccess.set(true);

        // Clear success message after 3 seconds
        setTimeout(() => this.resendSuccess.set(false), 3000);
      },
      error: (err) => {
        this.isResending.set(false);
        this.error.set(
          err.error?.message || 'Failed to resend code. Please try again.'
        );
      }
    });
  }

  /**
   * Handle modal close/cancel.
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Prevent clicks inside modal from closing it.
   */
  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}
