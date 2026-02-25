// src/app/features/account/pages/delete-account/delete-account.component.ts

import { Component, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { ConfirmDialogService } from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { AccountApiService } from '../../services';
import { AuthFacade } from '../../../../core/auth';
import { DataWarningDialogComponent } from '../../components/data-warning-dialog/data-warning-dialog.component';

/**
 * GDPR Account Deletion Request Page.
 *
 * Guides the user through a three-step flow before triggering a deletion request:
 *   1. Data warning dialog — offers to export personal data first.
 *   2. Confirmation input  — user must type "delete {username} account" to unlock submit.
 *   3. Confirm dialog      — final danger confirmation before sending the request.
 *
 * On success, navigates to /account/privacy?deletionRequested=true so the
 * privacy page can display a success banner.
 *
 * Route: /account/deletion-request
 */
@Component({
  selector: 'app-delete-account-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FeedbackComponent, DataWarningDialogComponent],
  templateUrl: './delete-account.component.html',
  styleUrl: './delete-account.component.scss'
})
export class DeleteAccountComponent extends FeedbackBase {

  private readonly accountApi     = inject(AccountApiService);
  private readonly authFacade     = inject(AuthFacade);
  private readonly confirmDialog  = inject(ConfirmDialogService);
  private readonly router         = inject(Router);
  private readonly destroyRef     = inject(DestroyRef);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Controls visibility of the data export warning dialog. */
  showDataWarning = signal(true);

  /** Current value of the confirmation input field. */
  inputValue = signal('');

  /** True while the deletion request API call is in progress. */
  isSubmitting = signal(false);

  // ===========================================================================
  // TEMPLATE HELPERS
  // ===========================================================================

  /**
   * The exact string the user must type to unlock the submit button.
   * Built from the authenticated username: "delete {username} account".
   */
  get expectedValue(): string {
    return `delete ${this.authFacade.username() ?? ''} account`;
  }

  /**
   * True when the input matches the expected confirmation string.
   */
  get isInputValid(): boolean {
    return this.inputValue().trim() === this.expectedValue;
  }

  // ===========================================================================
  // DIALOG HANDLERS
  // ===========================================================================

  /**
   * User chose to download their data first — navigate to export page.
   * The deletion flow is abandoned; user can return when ready.
   */
  onExportData(): void {
    this.router.navigate(['/account/privacy']);
  }

  /**
   * User acknowledged the warning and wants to continue with deletion.
   * Closes the data warning dialog and shows the confirmation input.
   */
  onProceedDelete(): void {
    this.showDataWarning.set(false);
  }

  // ===========================================================================
  // SUBMISSION
  // ===========================================================================

  /**
   * Triggered when the user clicks the delete button.
   * Opens the shared confirm dialog for a final danger confirmation,
   * then sends the GDPR deletion request on approval.
   */
  submit(): void {
    this.confirmDialog.confirm({
      title: 'Delete your account permanently?',
      message: 'This will schedule the permanent deletion of your account and all personal data. You will receive a confirmation email to finalise the process.',
      confirmButtonText: 'Yes, send confirmation email',
      cancelButtonText: 'Cancel',
      type: 'danger'
    })
      .then(() => {
        this.isSubmitting.set(true);
        this.clearFeedback();

        this.accountApi.requestDeletion()
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.isSubmitting.set(false))
          )
          .subscribe({
            next: () => this.router.navigate(
              ['/account/privacy'],
              { queryParams: { deletionRequested: 'true' } }
            ),
            error: err => this.displayError(
              err.error?.message ?? 'An error occurred. Please try again.'
            )
          });
      })
      .catch(() => { /* user cancelled — no-op */ });
  }

  /**
   * Updates the confirmation input signal on each keystroke.
   */
  onInputChange(value: string): void {
    this.inputValue.set(value);
  }
}
