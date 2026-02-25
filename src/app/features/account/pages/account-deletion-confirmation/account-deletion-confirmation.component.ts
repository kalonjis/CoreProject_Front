// src/app/features/account/pages/account-deletion-confirmation/account-deletion-confirmation.component.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { AccountApiService } from '../../services';
import { AuthFacade } from '../../../../core/auth';

/**
 * GDPR Account Deletion Confirmation Page.
 *
 * Reached via the single-use link sent by email after a deletion request.
 * Reads the token from the `?token=` query parameter, then:
 *   - Displays a confirmation button for the user to finalise deletion.
 *   - On success: clears the local auth session and redirects to /auth/login.
 *   - On expired/invalid token: displays an error pointing back to /account/privacy.
 *
 * Route: /account/deletion?token=xxx
 */
@Component({
  selector: 'app-account-deletion-confirmation',
  standalone: true,
  imports: [CommonModule, FeedbackComponent],
  templateUrl: './account-deletion-confirmation.component.html',
  styleUrl: './account-deletion-confirmation.component.scss'
})
export class AccountDeletionConfirmationComponent extends FeedbackBase implements OnInit {

  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly accountApi  = inject(AccountApiService);
  private readonly authFacade  = inject(AuthFacade);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Token extracted from query params. Null if missing or invalid URL. */
  token = signal<string | null>(null);

  /** True while the confirmation API call is in progress. */
  isProcessing = signal(false);

  /** Controls visibility of the confirm button. Hidden after submission. */
  showConfirmButton = signal(true);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const t = params.get('token');
      this.token.set(t);

      if (!t) {
        this.showConfirmButton.set(false);
        this.displayError(
          'No confirmation token found in the URL.',
          'Back to privacy settings'
        );
        this.buttonAction = () => this.router.navigate(['/account/privacy']);
      }
    });
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Sends the deletion confirmation request using the token from the URL.
   * On success, clears the auth session (cookies were cleared server-side)
   * and redirects to the login page.
   */
  confirm(): void {
    if (!this.token()) return;

    this.isProcessing.set(true);
    this.showConfirmButton.set(false);

    this.accountApi.confirmDeletion(this.token()!).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.authFacade.clearSession();
        this.displaySuccess(
          'Your account and all personal data have been permanently deleted. We hope our paths cross again.',
          'Go to login',
          null
        );
        this.buttonAction = () => this.router.navigate(['/auth/login']);
      },
      error: err => {
        this.isProcessing.set(false);
        this.showConfirmButton.set(false);

        if (err.status === 498 || err.status === 401) {
          this.displayError(
            'This confirmation link has expired or is invalid. Please submit a new deletion request from your account settings.',
            'Back to privacy settings'
          );
        } else {
          this.displayError(
            err.error?.message ?? 'An error occurred. Please try again.',
            'Back to privacy settings'
          );
        }
        this.buttonAction = () => this.router.navigate(['/account/privacy']);
      }
    });
  }
}
