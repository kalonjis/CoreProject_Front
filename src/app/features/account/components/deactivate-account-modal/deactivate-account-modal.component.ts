// src/app/features/account/pages/privacy/components/deactivate-account-modal/deactivate-account-modal.component.ts

import {
  Component,
  EventEmitter,
  Output,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  DeactivationReason,
  DEACTIVATION_REASON_LABELS,
  DEACTIVATION_REASON_ALLOWS_REACTIVATION,
  DeactivationReasonUtils,
} from '../../models';
import {AccountApiService} from '../../services';

type ModalStep = 'form' | 'confirm';

/**
 * Deactivate Account Modal Component.
 *
 * Two-step flow:
 * 1. Form  — select reason + provide details
 * 2. Confirm — summary + final confirmation button
 *
 * On success: emits `deactivationRequested` and parent closes modal.
 * User will receive a confirmation email with a token link.
 *
 * @example
 * ```html
 * <app-deactivate-account-modal
 *   (deactivationRequested)="onDeactivationRequested()"
 *   (cancel)="closeModal()">
 * </app-deactivate-account-modal>
 * ```
 */
@Component({
  selector: 'app-deactivate-account-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './deactivate-account-modal.component.html',
  styleUrl: './deactivate-account-modal.component.scss'
})
export class DeactivateAccountModalComponent {

  private fb       = inject(FormBuilder);
  private accountApi = inject(AccountApiService);
  private destroyRef = inject(DestroyRef);

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  /** Emitted when request was sent successfully — parent can close modal & show info message */
  @Output() deactivationRequested = new EventEmitter<void>();

  /** Emitted when user cancels at any step */
  @Output() cancel = new EventEmitter<void>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  currentStep = signal<ModalStep>('form');
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // ===========================================================================
  // FORM
  // ===========================================================================

  form: FormGroup = this.fb.group({
    reason: [null, Validators.required],
    reasonDetails: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  // ===========================================================================
  // TEMPLATE HELPERS
  // ===========================================================================

  /** All reasons as select options */
  readonly reasonOptions = DeactivationReasonUtils.all();

  /** Labels map for display in confirm step */
  readonly reasonLabels = DEACTIVATION_REASON_LABELS;

  get selectedReason(): DeactivationReason | null {
    return this.form.get('reason')?.value ?? null;
  }

  get isGdprSelected(): boolean {
    return this.selectedReason === DeactivationReason.GDPR_REQUEST;
  }

  get allowsReactivation(): boolean {
    return this.selectedReason
      ? DEACTIVATION_REASON_ALLOWS_REACTIVATION[this.selectedReason]
      : true;
  }

  get detailsCharCount(): number {
    return this.form.get('reasonDetails')?.value?.length ?? 0;
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /** Step 1 → Step 2 */
  goToConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.currentStep.set('confirm');
  }

  /** Step 2 → Step 1 */
  goBack(): void {
    this.currentStep.set('form');
    this.error.set(null);
  }

  /** Final submit — calls POST /api/account/request-deactivation */
  confirmDeactivation(): void {
    this.isSubmitting.set(true);
    this.error.set(null);

    this.accountApi.requestDeactivation(this.form.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => this.deactivationRequested.emit(),
        error: err => this.error.set(err.error?.message ?? 'An error occurred. Please try again.'),
      });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
