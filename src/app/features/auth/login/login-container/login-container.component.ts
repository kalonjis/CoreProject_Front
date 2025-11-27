import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthFacade, LoginRequest } from '../../../../core/auth';

import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { LoginFormComponent } from '../components/login-form/login-form.component';
import { OAuthButtonComponent } from '../components/oauth-button/oauth-button.component';

// ✅ SUPPRIMÉ: interface LoginFormData (utilise LoginRequest du barrel)

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

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // ✅ AVANT: private authService = inject(AuthService);
  // ✅ APRÈS: Utilise AuthFacade
  private readonly authFacade = inject(AuthFacade);

  // Container state
  isSubmitting = signal(false);
  loginError = signal<string | null>(null);
  unactivatedUsername = signal<string>('');

  ngOnInit(): void {
    this.handleUrlParams();
  }

  /**
   * Handles login form submission
   */
  handleLogin(formData: LoginRequest): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.loginError.set(null);

    this.authFacade.login(formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.displaySuccess('Login successful! Redirecting...', '', 2000);

        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        setTimeout(() => this.router.navigateByUrl(returnUrl), 1500);
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

      if (params['loggedOut'] === 'true') {
        this.displaySuccess('You have been logged out.', '', 3000);
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
    if (error.status === 401) {
      this.loginError.set('Invalid username or password');
      return;
    }

    if (error.status === 403) {
      const errorMessage = error.error?.error || '';

      if (errorMessage.includes('User account is not activated')) {
        const username = error.error?.username || '';
        this.unactivatedUsername.set(username);
        this.displayWarning(
          'Your account is not activated yet. Please check your email and click the activation link.',
          'Resend activation email',
          0
        );
        return;
      }

      if (errorMessage.includes('suspended') || errorMessage.includes('disabled by administrator')) {
        this.displayError(
          'Your account has been suspended. Please contact an administrator.',
          '',
          0
        );
        return;
      }

      this.loginError.set('Access denied');
      return;
    }

    this.loginError.set('An error occurred during login. Please try again.');
  }
}
