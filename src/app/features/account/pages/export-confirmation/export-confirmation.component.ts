// src/app/features/account/pages/export-confirmation/export-confirmation.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { FeedbackBase }      from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { GdprExportApiService } from '../../services/gdpr-export-api.service';

/**
 * ExportConfirmationComponent — landing page for the GDPR export confirmation email link.
 *
 * Route: /account/export/confirm?token=  (public — no authGuard)
 *
 * Flow:
 * 1. Extract `token` from query params on init.
 * 2. If no token → show error immediately.
 * 3. If token → auto-call GET /api/privacy/export/confirm?token= (no button needed,
 *    the user's intent is already expressed by clicking the email link).
 * 4. On 202 → success feedback + "Back to Privacy settings" button.
 * 5. On error → contextual error feedback + "Go to Privacy settings" button.
 *
 * Extends FeedbackBase to reuse the existing displaySuccess / displayError / FeedbackComponent
 * pattern used across all account confirmation pages.
 */
@Component({
    selector: 'app-export-confirmation',
    imports: [CommonModule, FeedbackComponent],
    templateUrl: './export-confirmation.component.html',
    styleUrl: './export-confirmation.component.scss'
})
export class ExportConfirmationComponent extends FeedbackBase implements OnInit {

  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly gdprApi = inject(GdprExportApiService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** True while the confirm API call is in flight. */
  isProcessing = false;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');

      if (!token) {
        this.displayError(
          'No confirmation token found in the URL. Please use the link from your email.',
          'Go to Privacy settings',
        );
        this.buttonAction = () => this.router.navigate(['/account/privacy']);
        return;
      }

      this.confirmExport(token);
    });
  }

  // ===========================================================================
  // PRIVATE
  // ===========================================================================

  /**
   * Calls the backend confirm endpoint and updates feedback accordingly.
   * Auto-triggered on init — no explicit user action required beyond the email click.
   */
  private confirmExport(token: string): void {
    this.isProcessing = true;

    this.gdprApi.confirm(token).subscribe({
      next: () => {
        this.isProcessing = false;
        this.displaySuccess(
          'Your request has been confirmed. Your archive is now being generated. You will receive an email with the download link when it is ready.',
          'Back to Privacy settings',
          null,
        );
        this.buttonAction = () => this.router.navigate(['/account/privacy']);
      },
      error: err => {
        this.isProcessing = false;

        const status  = err?.status;
        const message = err?.error?.message;

        if (status === 498 || status === 401) {
          this.displayError(
            'This confirmation link has expired or has already been used. Please request a new export from your Privacy settings.',
            'Go to Privacy settings',
          );
        } else if (status === 404) {
          this.displayError(
            'This confirmation link is invalid. Please use the link from your confirmation email.',
            'Go to Privacy settings',
          );
        } else {
          this.displayError(
            message ?? 'An error occurred while confirming your request. Please try again later.',
            'Go to Privacy settings',
          );
        }

        this.buttonAction = () => this.router.navigate(['/account/privacy']);
      },
    });
  }
}
