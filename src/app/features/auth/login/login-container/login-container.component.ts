// login-container.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthFacade } from '../../../../core/auth/services/auth.facade';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { LoginFormComponent } from '../components/login-form/login-form.component';
import { OAuthButtonComponent } from '../components/oauth-button/oauth-button.component';
import {LoginRequest} from '../../../../core/auth';
import {AccountApiService} from '../../../account/services';

export interface LoginFormData {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FeedbackComponent,
    LoginFormComponent,
    OAuthButtonComponent
  ],
  templateUrl: './login-container.component.html',
  styleUrl: './login-container.component.scss'
})
export class LoginContainerComponent extends FeedbackBase implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authFacade = inject(AuthFacade);

  private accountApi = inject(AccountApiService);

  private unactivatedIdentifier = signal<string>('');

  // Container state
  isSubmitting = signal(false);
  loginError = signal<string | null>(null);

  ngOnInit(): void {
    this.handleUrlParams();
  }

  /**
   * Handles login form submission
   */
  handleLogin(formData: LoginFormData): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.loginError.set(null);
    this.unactivatedIdentifier.set(formData.username);

    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    this.authFacade.initiateLogin(formData, returnUrl).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        // Navigation is handled by AuthFacade
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.handleLoginError(error);
      }
    });
  }

  /**
   * Handles URL query parameters for feedback messages
   */
  private handleUrlParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['passwordChanged'] === 'true') {
        this.displaySuccess(
          'Your password has been successfully updated. Please log in with your new password.',
          '',
          5000
        );
      }

      if (params['expired'] === 'true') {
        this.displayWarning('Your session has expired. Please log in again.', '', 5000);
      }

      if (params['error'] === 'oauth2') {
        this.displayError(
          'Error during GitHub authentication. Please try again.',
          '',
          5000
        );
      }
    });
  }

  /**
   * Handles login errors and displays appropriate feedback
   */

  private handleLoginError(error: HttpErrorResponse): void {
    console.error(error);
    if (error.status === 401) {
      this.loginError.set('Invalid username or password');
      return;
    }

    if (error.status === 403) {
      const errorMessage: string = error.error?.message || error.error?.error || '';

      if (errorMessage.includes('ACCOUNT_NOT_ACTIVATED') || errorMessage.includes('not been activated')) {
        this.displayWarning(
          'Your account has never been activated. Please check your email and follow the activation instructions.',
          'Resend activation email',
          0
        );
        this.buttonAction = () => this.resendActivationEmail(); // ← wiring du bouton
        return;
      }

      if (errorMessage.includes('disabled') || errorMessage.includes('suspended')) {
        this.displayError('Your account has been suspended. Please contact an administrator.', '', 0);
        return;
      }

      this.loginError.set('Access denied');
      return;
    }

    if (error.status === 423) {
      // Account locked — message visible, pas d'énumération (username déjà connu)
      this.displayWarning(
        error.error?.error || 'Your account is temporarily locked. Check your email.',
        '', 0
      );
      return;
    }

    if (error.status === 429) {
      // IP blocked — afficher le Retry-After
      const retryAfter = error.headers?.get('Retry-After');
      const msg = retryAfter
        ? `Too many attempts. Please try again in ${Math.ceil(+retryAfter / 60)} minutes.`
        : 'Too many attempts. Please try again later.';
      this.displayWarning(msg, '', 0);
      return;
    }

    this.loginError.set('An error occurred during login. Please try again.');
  }

  private resendActivationEmail(): void {
    const identifier = this.unactivatedIdentifier();
    if (!identifier) return;

    this.accountApi.resendActivationByIdentifier(identifier).subscribe({
      next: () => {
        this.displaySuccess('Activation email sent! Please check your inbox.', '', 5000);
      },
      error: () => {
        this.displayError('Failed to send activation email. Please try again.', 'Retry', 0);
        this.buttonAction = () => this.resendActivationEmail(); // ← retry possible
      }
    });
  }

  /**
   * Handles feedback button clicks (e.g., resend activation)

  handleFeedbackButtonClick(): void {
    const username = this.unactivatedUsername();
    if (username) {
      this.authService.(username).subscribe({
        next: () => {
          this.displaySuccess(
            'Activation email sent! Please check your inbox.',
            '',
            3000
          );
        },
        error: () => {
          this.displayError(
            'Failed to send activation email. Please try again.',
            '',
            3000
          );
        }
      });
    }
  }*/
}
