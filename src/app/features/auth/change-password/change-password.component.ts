import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';

// ✅ AVANT: import { AuthService } from '../../../core/auth/services/auth.service';
// ✅ APRÈS: Import depuis le barrel
import { AuthFacade } from '../../../core/auth';
import { HttpUtilService } from '../../../core/http';

/** Request payload for password change */
interface ChangePasswordRequest {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FeedbackComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent extends FeedbackBase {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http = inject(HttpUtilService);

  // ✅ AVANT: private authService = inject(AuthService);
  // ✅ APRÈS: AuthFacade pour logout
  private readonly auth = inject(AuthFacade);

  // Local state
  isSubmitting = signal(false);
  showPassword = signal(false);
  showCurrentPassword = signal(false);

  // Password strength indicators
  passwordHasMinLength = signal(false);
  passwordHasUppercase = signal(false);
  passwordHasLowercase = signal(false);
  passwordHasNumber = signal(false);
  passwordHasSpecialChar = signal(false);

  // Form validation
  passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  };

  // Form
  changePasswordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: [this.passwordMatchValidator] });

  constructor() {
    super();
    this.setupPasswordStrengthObserver();
  }

  private setupPasswordStrengthObserver(): void {
    this.changePasswordForm.get('password')?.valueChanges.subscribe(password => {
      if (password) {
        this.updatePasswordStrength(password);
      } else {
        this.resetPasswordStrength();
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.update(v => !v);
  }

  updatePasswordStrength(password: string): void {
    this.passwordHasMinLength.set(password.length >= 8);
    this.passwordHasUppercase.set(/[A-Z]/.test(password));
    this.passwordHasLowercase.set(/[a-z]/.test(password));
    this.passwordHasNumber.set(/\d/.test(password));
    this.passwordHasSpecialChar.set(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
  }

  resetPasswordStrength(): void {
    this.passwordHasMinLength.set(false);
    this.passwordHasUppercase.set(false);
    this.passwordHasLowercase.set(false);
    this.passwordHasNumber.set(false);
    this.passwordHasSpecialChar.set(false);
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.clearFeedback();

    const formData: ChangePasswordRequest = {
      currentPassword: this.changePasswordForm.value.currentPassword || '',
      password: this.changePasswordForm.value.password || '',
      confirmPassword: this.changePasswordForm.value.confirmPassword || ''
    };

    // ✅ AVANT: this.authService.changePassword(formData).subscribe(...)
    // ✅ APRÈS: Appel HTTP direct (action spécifique, pas dans la facade)
    this.http.put('/api/password/change', formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);

        this.displaySuccess(
          'Votre mot de passe a été modifié avec succès. Vous allez être déconnecté.',
          'OK',
          null
        );

        this.buttonAction = () => this.logoutAndRedirect();

        // Auto logout after 5 seconds
        setTimeout(() => this.logoutAndRedirect(), 5000);
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.displayError(
          error.error?.message || 'Une erreur est survenue.',
          'Réessayer'
        );
        this.buttonAction = () => this.clearFeedback();
      }
    });
  }

  // ✅ AVANT: this.authService.logout().subscribe(...)
  // ✅ APRÈS: Utilise AuthFacade.logout()
  private logoutAndRedirect(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login'], {
          queryParams: { passwordChanged: 'true' }
        });
      },
      error: () => {
        // Even on error, redirect
        this.router.navigate(['/auth/login'], {
          queryParams: { passwordChanged: 'true' }
        });
      }
    });
  }
}
