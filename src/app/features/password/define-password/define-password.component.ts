// src/app/features/password/define-password/define-password.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { PasswordApiService } from '../services/password-api.service';
import { AuthFacade } from '../../../core/auth/services/auth.facade';

/**
 * DefinePasswordComponent - Password definition for OAuth users.
 *
 * This component allows users who signed up via OAuth (Google, GitHub, Microsoft)
 * to define a password so they can also login with credentials.
 *
 * Prerequisites:
 * - User must be authenticated
 * - User must NOT have a password defined (!hasPassword)
 *
 * Features:
 * - Password strength indicators
 * - Password confirmation validation
 * - Session reload after successful definition
 *
 * Route: /password/define
 */
@Component({
  selector: 'app-define-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FeedbackComponent],
  templateUrl: './define-password.component.html',
  styleUrl: './define-password.component.scss'
})
export class DefinePasswordComponent extends FeedbackBase implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly passwordApi = inject(PasswordApiService);
  private readonly authFacade = inject(AuthFacade);

  // Component state
  isSubmitting = signal(false);
  defineCompleted = signal(false);
  showPassword = signal(false);

  // Password strength indicators
  passwordHasMinLength = signal(false);
  passwordHasUppercase = signal(false);
  passwordHasLowercase = signal(false);
  passwordHasNumber = signal(false);
  passwordHasSpecialChar = signal(false);

  // Password match validator
  private passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  };

  // Form (no currentPassword needed for OAuth users)
  definePasswordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: [this.passwordMatchValidator] });

  ngOnInit(): void {
    // Redirect if user already has a password
    if (this.authFacade.hasPassword()) {
      this.router.navigate(['/password/change']);
      return;
    }

    // Subscribe to password changes for strength indicators
    this.definePasswordForm.get('password')?.valueChanges.subscribe(password => {
      if (password) {
        this.updatePasswordStrength(password);
      } else {
        this.resetPasswordStrength();
      }
    });
  }

  /**
   * Toggle password visibility.
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  /**
   * Update password strength indicators.
   */
  updatePasswordStrength(password: string): void {
    this.passwordHasMinLength.set(password.length >= 8);
    this.passwordHasUppercase.set(/[A-Z]/.test(password));
    this.passwordHasLowercase.set(/[a-z]/.test(password));
    this.passwordHasNumber.set(/\d/.test(password));
    this.passwordHasSpecialChar.set(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
  }

  /**
   * Reset password strength indicators.
   */
  resetPasswordStrength(): void {
    this.passwordHasMinLength.set(false);
    this.passwordHasUppercase.set(false);
    this.passwordHasLowercase.set(false);
    this.passwordHasNumber.set(false);
    this.passwordHasSpecialChar.set(false);
  }

  /**
   * Handle form submission.
   */
  onSubmit(): void {
    if (this.definePasswordForm.invalid) {
      Object.keys(this.definePasswordForm.controls).forEach(key => {
        this.definePasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    const password = this.definePasswordForm.value.password || '';
    const confirmPassword = this.definePasswordForm.value.confirmPassword || '';

    this.isSubmitting.set(true);
    this.clearFeedback();

    this.passwordApi.definePassword({ password, confirmPassword }).subscribe({
      next: () => {
        // Reload session to update hasPassword flag
        this.authFacade.reloadSession().subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.defineCompleted.set(true);
            this.displaySuccess(
              'Your password has been defined successfully. You can now login with your email and password.',
              'Go to Security Settings',
              null
            );
            this.buttonAction = () => this.router.navigate(['/account/security']);
          },
          error: () => {
            // Session reload failed, but password was defined
            this.isSubmitting.set(false);
            this.defineCompleted.set(true);
            this.displaySuccess(
              'Your password has been defined successfully.',
              'Go to Security Settings',
              null
            );
            this.buttonAction = () => this.router.navigate(['/account/security']);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.handleError(error);
      }
    });
  }

  /**
   * Handle API errors.
   */
  private handleError(error: HttpErrorResponse): void {
    let message = 'An error occurred. Please try again.';

    if (error.status === 400) {
      message = error.error?.message || 'Invalid password. Please check the requirements.';
    } else if (error.status === 409) {
      // Password already defined
      message = 'You already have a password defined. Redirecting to change password...';
      setTimeout(() => this.router.navigate(['/password/change']), 2000);
    } else if (error.status === 401) {
      message = 'Your session has expired. Please login again.';
      this.buttonAction = () => this.router.navigate(['/auth/login']);
    }

    this.displayError(message, 'Retry', null);
    this.buttonAction = () => this.clearFeedback();
  }
}
