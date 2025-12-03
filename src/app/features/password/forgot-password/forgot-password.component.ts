import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { PasswordApiService } from '../services/password-api.service';
import { NotificationType } from '../models/password-request.model';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FeedbackComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent extends FeedbackBase {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly passwordApi = inject(PasswordApiService);

  // Component state
  isSubmitting = signal(false);
  resetRequested = signal(false);
  selectedMethod = signal<NotificationType>('EMAIL');

  // Form
  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  /**
   * Select notification method (EMAIL or SMS).
   */
  selectMethod(method: NotificationType): void {
    this.selectedMethod.set(method);
  }

  /**
   * Handle form submission.
   */
  onSubmit(): void {
    if (this.resetForm.invalid) {
      Object.keys(this.resetForm.controls).forEach(key => {
        this.resetForm.get(key)?.markAsTouched();
      });
      return;
    }

    const email = this.resetForm.value.email?.trim() || '';
    if (!email) return;

    this.isSubmitting.set(true);
    this.clearFeedback();

    this.passwordApi.forgotPassword({
      email,
      notificationType: this.selectedMethod()
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);

        if (this.selectedMethod() === 'SMS') {
          // Redirect to SMS verification page
          this.router.navigate(['/password/verify-sms']);
        } else {
          // Show success message for email
          this.resetRequested.set(true);
          this.displaySuccess(
            'Si un compte existe avec cette adresse e-mail, vous recevrez un lien de réinitialisation dans quelques instants.',
            'Retour à la connexion',
            null
          );
          this.buttonAction = () => this.router.navigate(['/auth/login']);
        }
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
    let message = 'Une erreur est survenue. Veuillez réessayer.';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 429) {
      message = 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
    }

    this.displayError(message, 'Réessayer');
    this.buttonAction = () => this.clearFeedback();
  }
}
