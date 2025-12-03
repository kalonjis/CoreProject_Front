import { Component, inject, signal, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { CodeInputComponent } from '../../../shared/code-input/code-input.component';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { PasswordApiService } from '../services/password-api.service';

@Component({
  selector: 'app-verify-sms',
  standalone: true,
  imports: [CommonModule, RouterLink, CodeInputComponent, FeedbackComponent],
  templateUrl: './verify-sms.component.html',
  styleUrl: './verify-sms.component.scss'
})
export class VerifySmsComponent extends FeedbackBase implements OnInit, OnDestroy {

  private readonly router = inject(Router);
  private readonly passwordApi = inject(PasswordApiService);

  @ViewChild(CodeInputComponent) codeInput!: CodeInputComponent;

  // =========================================================================
  // STATE
  // =========================================================================

  isVerifying = signal(false);
  isResending = signal(false);
  codeError = signal<string | null>(null);

  // Resend cooldown
  resendCooldown = signal(0);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    // Start initial cooldown (prevent immediate resend)
    this.startCooldown(30);
  }

  ngOnDestroy(): void {
    this.clearCooldownInterval();
  }

  // =========================================================================
  // CODE VERIFICATION
  // =========================================================================

  /**
   * Called when user completes the code input.
   */
  onCodeComplete(code: string): void {
    this.verifyCode(code);
  }

  /**
   * Manual submit (if autoSubmit is disabled).
   */
  onSubmit(): void {
    const code = this.codeInput?.getCode();
    if (code && code.length === 6) {
      this.verifyCode(code);
    }
  }

  /**
   * Verify the SMS code with backend.
   */
  private verifyCode(code: string): void {
    this.isVerifying.set(true);
    this.codeError.set(null);
    this.clearFeedback();

    this.passwordApi.verifySmsCode({ verificationCode: code }).subscribe({
      next: () => {
        this.isVerifying.set(false);
        this.displaySuccess(
          'Code vérifié avec succès ! Redirection...',
          '',
          2000
        );

        // Redirect to reset password page
        setTimeout(() => {
          this.router.navigate(['/password/reset']);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        this.isVerifying.set(false);
        this.handleVerifyError(error);
      }
    });
  }

  /**
   * Handle verification errors.
   */
  private handleVerifyError(error: HttpErrorResponse): void {
    // Reset input for retry
    this.codeInput?.reset();

    const errorCode = error.error?.error;
    const errorMessage = error.error?.message;

    switch (errorCode) {
      case 'INVALID_CODE':
        this.codeError.set('Code invalide. Veuillez vérifier et réessayer.');
        break;

      case 'CODE_EXPIRED':
        this.displayError(
          'Le code a expiré. Veuillez demander un nouveau code.',
          'Renvoyer le code'
        );
        this.buttonAction = () => this.resendCode();
        break;

      case 'TOO_MANY_ATTEMPTS':
        this.displayError(
          'Trop de tentatives. Veuillez demander un nouveau code.',
          'Renvoyer le code'
        );
        this.buttonAction = () => this.resendCode();
        break;

      case 'SESSION_EXPIRED':
        this.displayError(
          'Votre session a expiré. Veuillez recommencer.',
          'Recommencer'
        );
        this.buttonAction = () => this.router.navigate(['/password/forgot']);
        break;

      default:
        this.codeError.set(errorMessage || 'Une erreur est survenue. Veuillez réessayer.');
    }
  }

  // =========================================================================
  // RESEND CODE
  // =========================================================================

  /**
   * Resend verification code.
   */
  resendCode(): void {
    if (this.resendCooldown() > 0 || this.isResending()) {
      return;
    }

    this.isResending.set(true);
    this.codeError.set(null);
    this.clearFeedback();

    /**this.passwordApi.resendSmsCode().subscribe({
      next: () => {
        this.isResending.set(false);
        this.displaySuccess(
          'Un nouveau code a été envoyé à votre téléphone.',
          '',
          3000
        );
        this.codeInput?.reset();
        this.startCooldown(60);
      },
      error: (error: HttpErrorResponse) => {
        this.isResending.set(false);
        this.handleResendError(error);
      }
    });*/
  }

  /**
   * Handle resend errors.
   */
  private handleResendError(error: HttpErrorResponse): void {
    const errorCode = error.error?.error;

    switch (errorCode) {
      case 'TOO_MANY_REQUESTS':
        this.displayWarning(
          'Veuillez patienter avant de demander un nouveau code.',
          'OK'
        );
        this.buttonAction = () => this.clearFeedback();
        this.startCooldown(60);
        break;

      case 'SESSION_EXPIRED':
        this.displayError(
          'Votre session a expiré. Veuillez recommencer.',
          'Recommencer'
        );
        this.buttonAction = () => this.router.navigate(['/password/forgot']);
        break;

      default:
        this.displayError(
          'Impossible de renvoyer le code. Veuillez réessayer.',
          'Réessayer'
        );
        this.buttonAction = () => this.clearFeedback();
    }
  }

  // =========================================================================
  // COOLDOWN TIMER
  // =========================================================================

  private startCooldown(seconds: number): void {
    this.clearCooldownInterval();
    this.resendCooldown.set(seconds);

    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        this.clearCooldownInterval();
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  private clearCooldownInterval(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  /**
   * Go back to forgot password.
   */
  goBack(): void {
    this.router.navigate(['/password/forgot']);
  }
}
