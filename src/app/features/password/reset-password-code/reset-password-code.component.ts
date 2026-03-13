import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { PasswordApiService } from '../services/password-api.service';

@Component({
    selector: 'app-reset-password-code',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, FeedbackComponent],
    templateUrl: './reset-password-code.component.html',
    styleUrl: './reset-password-code.component.scss'
})
export class ResetPasswordCodeComponent extends FeedbackBase implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly passwordApi = inject(PasswordApiService);

  // Component state
  isSubmitting = signal(false);
  resetCompleted = signal(false);
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

  // Form
  resetPasswordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: [this.passwordMatchValidator] });

  ngOnInit(): void {
    // Subscribe to password changes for strength indicators
    this.resetPasswordForm.get('password')?.valueChanges.subscribe(password => {
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
    if (this.resetPasswordForm.invalid) {
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    const password = this.resetPasswordForm.value.password?.trim() || '';
    const confirmPassword = this.resetPasswordForm.value.confirmPassword?.trim() || '';

    if (!password || !confirmPassword) return;

    this.isSubmitting.set(true);
    this.clearFeedback();

    // Use resetPasswordWithPermission - relies on cookie set by verify-code
    this.passwordApi.resetPasswordWithPermission({
      password: password,
      confirmPassword: confirmPassword
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.resetCompleted.set(true);
        this.displaySuccess(
          'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
          'Se connecter',
          null
        );
        this.buttonAction = () => this.router.navigate(['/auth/login']);
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
  /**
   * Handles API errors from the password reset endpoint (EMAIL_LINK flow).
   *
   * <p>404 and 498 (expired token) are handled directly in {@link onSubmit}
   * before reaching this method, so they are not repeated here.
   *
   * <p>No cookie is involved in this flow — errors only concern
   * password policy validation.
   *
   * @param error the HTTP error response from the reset endpoint
   */
  private handleError(error: HttpErrorResponse): void {
    const errorCode = error.error?.error;

    switch (errorCode) {
      case 'INVALID_PASSWORD':
        this.displayError(
          'Le mot de passe ne respecte pas les critères de sécurité.',
          'Réessayer'
        );
        this.buttonAction = () => this.clearFeedback();
        break;

      case 'PASSWORD_MISMATCH':
        this.displayError(
          'Les mots de passe ne correspondent pas.',
          'Réessayer'
        );
        this.buttonAction = () => this.clearFeedback();
        break;

      case 'PASSWORD_ALREADY_USED':
        this.displayError(
          error.error?.message ||
          'Ce mot de passe a déjà été utilisé récemment. Veuillez en choisir un autre.',
          'Réessayer'
        );
        this.buttonAction = () => this.clearFeedback();
        break;

      default:
        if (error.status === 409) {
          this.displayError(
            error.error?.message ||
            'Ce mot de passe a déjà été utilisé récemment. Veuillez en choisir un autre.',
            'Réessayer'
          );
        } else {
          this.displayError(
            'Une erreur est survenue. Veuillez réessayer.',
            'Réessayer'
          );
        }
        this.buttonAction = () => this.clearFeedback();
        break;
    }
  }
}
