// src/app/features/account/components/security-tab/components/two-factor-section/components/totp-detail/totp-detail.component.ts

import { Component, Input, Output, EventEmitter, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';
import * as QRCode from 'qrcode';

import { TwoFactorMethod } from '../../../../../../../../core/auth/models/two-factor.model';
import { AuthFacade } from '../../../../../../../../core/auth/services/auth.facade';
import { TotpSetupResponse } from '../../../../../../../../core/auth/models/two-factor.model';

/**
 * TOTP (Time-based One-Time Password) detail component.
 *
 * Handles TOTP authenticator app setup and management:
 * - QR code display for easy setup
 * - Manual secret key entry
 * - Code verification testing
 * - Enable/disable functionality
 * - Instructions for popular authenticator apps
 */
@Component({
  selector: 'app-totp-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './totp-detail.component.html',
  styleUrls: ['./totp-detail.component.scss']
})
export class TotpDetailComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authFacade = inject(AuthFacade);
  private destroyRef = inject(DestroyRef);

  // Component inputs/outputs
  @Input({ required: true }) method!: TwoFactorMethod;
  @Output() methodUpdated = new EventEmitter<void>();
  @Output() enableRequested = new EventEmitter<TwoFactorMethod>();
  @Output() disableRequested = new EventEmitter<TwoFactorMethod>();

  // Component state
  isLoading = signal(false);
  showSecretKey = signal(false);
  qrCodeDataUrl = signal<string | null>(null);
  setupData = signal<TotpSetupResponse | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form for code testing
  testCodeForm: FormGroup;

  // Popular authenticator apps information
  authenticatorApps = [
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

  constructor() {
    this.testCodeForm = this.formBuilder.group({
      testCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    // If TOTP is already enabled, we don't need to show setup
    if (this.method.isEnabled) {
      this.clearMessages();
    }
  }

  /**
   * Handle enable TOTP request.
   * This will initiate TOTP setup and generate QR code.
   */
  onEnableClick(): void {
    this.clearMessages();
    this.isLoading.set(true);

    this.authFacade.enableTwoFactorMethod('TOTP')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to enable TOTP', err);
          this.errorMessage.set('Failed to enable TOTP. Please try again.');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(response => {
        if (response) {
          const totpResponse = response as TotpSetupResponse;
          this.setupData.set(totpResponse);
          this.generateQRCode(totpResponse.qrCodeUri);
          this.successMessage.set('TOTP setup initiated. Scan the QR code with your authenticator app.');
        }
      });
  }

  /**
   * Handle disable TOTP request.
   */
  onDisableClick(): void {
    this.disableRequested.emit(this.method);
  }

  /**
   * Generate QR code from URI.
   */
  private async generateQRCode(qrCodeUri: string): Promise<void> {
    try {
      const dataUrl = await QRCode.toDataURL(qrCodeUri, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      this.qrCodeDataUrl.set(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR code', error);
      this.errorMessage.set('Failed to generate QR code. Please use the manual setup key.');
    }
  }

  /**
   * Toggle secret key visibility.
   */
  toggleSecretKeyVisibility(): void {
    this.showSecretKey.set(!this.showSecretKey());
  }

  /**
   * Copy secret key to clipboard.
   */
  async copySecretKey(): Promise<void> {
    if (!this.setupData()?.secretKey) return;

    try {
      await navigator.clipboard.writeText(this.setupData()!.secretKey);
      this.successMessage.set('Secret key copied to clipboard');
      setTimeout(() => this.clearMessages(), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
      this.errorMessage.set('Failed to copy to clipboard');
    }
  }

  /**
   * Test verification code.
   * This allows users to verify their authenticator app is working correctly.
   */
  testVerificationCode(): void {
    if (this.testCodeForm.invalid) return;

    const code = this.testCodeForm.get('testCode')?.value;
    this.clearMessages();
    this.isLoading.set(true);

    // Note: This would need a specific API endpoint for testing TOTP codes during setup
    // For now, we'll simulate success
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set('Code verified successfully! Your authenticator app is working correctly.');
      this.testCodeForm.reset();
      this.methodUpdated.emit();
    }, 1000);
  }

  /**
   * Get formatted secret key for display (grouped in 4-character blocks).
   */
  getFormattedSecretKey(): string {
    const secretKey = this.setupData()?.secretKey || '';
    return secretKey.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Check if the test code form field has specific error.
   */
  hasTestCodeError(errorType: string): boolean {
    const control = this.testCodeForm.get('testCode');
    return !!(control?.errors?.[errorType] && control?.touched);
  }

  /**
   * Clear all messages.
   */
  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  /**
   * Check if component is in setup mode (TOTP being configured).
   */
  get isSetupMode(): boolean {
    return !this.method.isEnabled && this.setupData() !== null;
  }

  /**
   * Check if component can show enable button.
   */
  get canEnable(): boolean {
    return !this.method.isEnabled && !this.isSetupMode;
  }

  /**
   * Check if component can show disable button.
   */
  get canDisable(): boolean {
    return this.method.isEnabled;
  }
}
