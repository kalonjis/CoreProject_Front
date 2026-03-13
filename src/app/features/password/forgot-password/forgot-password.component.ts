import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { PasswordApiService } from '../services/password-api.service';
import { PasswordOperationResponse } from '../models/password-response.model';

type ResetMethod = 'EMAIL_LINK' | 'EMAIL_CODE' | 'SMS_CODE';

@Component({
    selector: 'app-forgot-password',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, FeedbackComponent],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent extends FeedbackBase {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly passwordApi = inject(PasswordApiService);

  isSubmitting = signal(false);
  resetRequested = signal(false);
  selectedMethod = signal<ResetMethod>('EMAIL_LINK');

  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  selectMethod(method: ResetMethod): void {
    this.selectedMethod.set(method);
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      Object.keys(this.resetForm.controls).forEach(k => this.resetForm.get(k)?.markAsTouched());
      return;
    }

    const email = this.resetForm.value.email?.trim().toLowerCase() || '';
    if (!email) return;

    this.isSubmitting.set(true);
    this.clearFeedback();

    this.callApi(email).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.handleSuccess(response);
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.handleError(error);
      }
    });
  }

  // =========================================================================
  // PRIVATE
  // =========================================================================

  private callApi(email: string): Observable<PasswordOperationResponse> {
    const request = { email };
    switch (this.selectedMethod()) {
      case 'EMAIL_LINK':  return this.passwordApi.forgotPasswordEmailLink(request);
      case 'EMAIL_CODE':  return this.passwordApi.forgotPasswordEmailCode(request);
      case 'SMS_CODE':    return this.passwordApi.forgotPasswordSmsCode(request);
    }
  }

  private handleSuccess(response: PasswordOperationResponse): void {
    const method = this.selectedMethod();

    if (method === 'EMAIL_CODE' || method === 'SMS_CODE') {
      this.router.navigate(['/password/verify-code']);
      return;
    }

    // EMAIL_LINK — show confirmation in place
    this.resetRequested.set(true);
    this.displaySuccess(
      response.message ?? 'Si un compte existe avec cette adresse e-mail, vous recevrez un lien de réinitialisation dans quelques instants.',
      'Retour à la connexion',
      null
    );
    this.buttonAction = () => this.router.navigate(['/auth/login']);
  }

  private handleError(error: HttpErrorResponse): void {
    const message = error.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
    this.displayError(message);
  }
}
