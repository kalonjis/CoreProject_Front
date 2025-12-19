// src/app/features/password/define-password/define-password.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { PasswordApiService } from '../services/password-api.service';
import {AuthFacade} from '../../../core/auth';

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

  // Form - NO currentPassword field (OAuth users don't have one)
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

    this.isSubmitting.set(true);
    this.clearFeedback();

    const request = {
      password: this.definePasswordForm.value.password!,
      confirmPassword: this.definePasswordForm.value.confirmPassword!
    };

    this.passwordApi.definePassword(request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.displaySuccess(
          response.message || 'Your password has been set successfully. You can now login with your email and password.',
          'Go to Dashboard',
          null
        );
        this.buttonAction = () => this.router.navigate(['/']);

        // Refresh user session to update hasPassword flag
        this.authFacade.reloadSession().subscribe();
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
    } else if (error.status === 401) {
      message = 'Session expired. Please login again.';
      this.router.navigate(['/auth/login']);
    } else if (error.status === 403) {
      message = 'You already have a password defined.';
    }

    this.displayError(message);
  }

  /**
   * Check if a field is invalid.
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.definePasswordForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}
