// src/app/features/account/pages/two-factor/totp-two-factor/components/totp-setup-modal/totp-setup-modal.component.ts

import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  inject,
  OnInit,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';
import * as QRCode from 'qrcode';

import { TwoFactorApiService  } from '../../../../../../../core/auth/services/two-factor-api.service';
import {TotpSetupInitiateResponse, TotpSetupResponse} from '../../../../../../../core/auth/models/two-factor.model';

/**
 * TOTP Setup Modal Component.
 *
 * Handles the complete TOTP setup flow:
 * 1. Generate secret key and QR code
 * 2. Display QR code for scanning
 * 3. Provide manual secret key entry option
 * 4. Verify user's test code
 * 5. Activate TOTP on successful verification
 *
 * Features:
 * - QR code generation for easy setup
 * - Manual secret key display with show/hide
 * - Code verification form with validation
 * - Support info for popular authenticator apps
 * - Error handling and loading states
 */
@Component({
    selector: 'app-totp-setup-modal',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './totp-setup-modal.component.html',
    styleUrl: './totp-setup-modal.component.scss'
})
export class TotpSetupModalComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private twoFactorApi = inject(TwoFactorApiService);
  private destroyRef = inject(DestroyRef);

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** User display name for TOTP account identification */
  @Input() userDisplayName?: string;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  /** Emitted when setup is successfully completed */
  @Output() setupComplete = new EventEmitter<void>();

  /** Emitted when user cancels/closes the modal */
  @Output() cancel = new EventEmitter<void>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Loading state for initial setup data */
  isLoading = signal(true);

  /** Whether code verification is in progress */
  isVerifying = signal(false);

  /** Error message to display */
  errorMessage = signal<string | null>(null);

  /** Success message after verification */
  successMessage = signal<string | null>(null);

  /** Whether to show the secret key in plain text */
  showSecretKey = signal(false);

  /** Generated QR code as data URL */
  qrCodeDataUrl = signal<string | null>(null);

  /** TOTP setup data from backend */
  setupData = signal<TotpSetupInitiateResponse | null>(null);

  /** Form for code verification */
  verificationForm: FormGroup;

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /** Popular authenticator apps information */
  readonly authenticatorApps = [
    {
      name: 'Google Authenticator',
      platforms: ['iOS', 'Android'],
      icon: '🔐'
    },
    {
      name: 'Microsoft Authenticator',
      platforms: ['iOS', 'Android', 'Windows'],
      icon: '🛡️'
    },
    {
      name: 'Authy',
      platforms: ['iOS', 'Android', 'Desktop'],
      icon: '🔑'
    },
    {
      name: '1Password',
      platforms: ['All platforms'],
      icon: '🗝️'
    }
  ];

  // ===========================================================================
  // CONSTRUCTOR
  // ===========================================================================

  constructor() {
    this.verificationForm = this.formBuilder.group({
      verificationCode: ['', [
        Validators.required,
        Validators.pattern(/^\d{6}$/)
      ]]
    });
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.initiateTotpSetup();
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Initiate TOTP setup by calling the 2-step flow API.
   * Step 1: Generate secret key and QR code (activation token stored in cookie).
   */
  protected initiateTotpSetup(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.twoFactorApi.initiateTotpSetup()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to initiate TOTP setup', err);
          this.errorMessage.set(
            err.error?.message || 'Failed to generate TOTP configuration. Please try again.'
          );
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(response => {
        if (response) {
          this.setupData.set(response);
          this.generateQrCode(response.qrCodeUri);
        }
      });
  }

  /**
   * Generate QR code from TOTP URL.
   */
  private generateQrCode(totpUri: string): void {
    QRCode.toDataURL(totpUri, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
      .then(url => {
        this.qrCodeDataUrl.set(url);
      })
      .catch(err => {
        console.error('Failed to generate QR code', err);
        this.errorMessage.set('Failed to generate QR code');
      });
  }

  /**
   * Clear all messages.
   */
  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  /**
   * Toggle secret key visibility.
   */
  toggleSecretKeyVisibility(): void {
    this.showSecretKey.update(show => !show);
  }

  /**
   * Get formatted secret key for display (grouped in 4-character blocks).
   */
  getFormattedSecretKey(): string {
    const secretKey = this.setupData()?.secretKey || '';
    return secretKey.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Copy secret key to clipboard.
   */
  async copySecretKey(): Promise<void> {
    const secretKey = this.setupData()?.secretKey;
    if (!secretKey) return;

    try {
      await navigator.clipboard.writeText(secretKey);
      this.successMessage.set('Secret key copied to clipboard');
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (err) {
      console.error('Failed to copy secret key', err);
      this.errorMessage.set('Failed to copy secret key');
    }
  }

  /**
   * Handle verification code submission.
   * Step 2: Verify the TOTP code and activate 2FA.
   */
  onVerifyCode(): void {
    if (this.verificationForm.invalid) {
      this.markFormGroupTouched(this.verificationForm);
      return;
    }

    const verificationCode = this.verificationForm.get('verificationCode')?.value;
    this.isVerifying.set(true);
    this.clearMessages();

    this.twoFactorApi.verifyTotpSetup(verificationCode)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to verify TOTP code', err);
          this.errorMessage.set(
            err.error?.message || 'Invalid verification code. Please try again.'
          );
          return of(null);
        }),
        finalize(() => this.isVerifying.set(false))
      )
      .subscribe(response => {
        if (response) {
          this.successMessage.set('TOTP authentication enabled successfully!');
          setTimeout(() => this.setupComplete.emit(), 1000);
        }
      });
  }

  /**
   * Handle modal close/cancel.
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Prevent clicks inside modal from closing it.
   */
  onModalClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Check if verification form field has specific error.
   */
  hasVerificationError(errorType: string): boolean {
    const control = this.verificationForm.get('verificationCode');
    return !!(control?.errors?.[errorType] && control?.touched);
  }

  /**
   * Mark all fields in form group as touched.
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
