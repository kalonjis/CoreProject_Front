// src/app/features/auth/two-factor/components/verify-code/verify-code.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { CodeInputComponent } from '../../../../../shared/code-input/code-input.component';
import { TwoFactorType, getTwoFactorConfig } from '../../../../../core/auth';
import { BackupCodeInputComponent } from '../../../../../shared/backup-code-input/backup-code-input.component';

/**
 * VerifyCodeComponent - Presentational component for 2FA code verification.
 *
 * Adapts to different 2FA types:
 * - TOTP: Shows authenticator app hint, no resend
 * - EMAIL: Shows masked email, resend button with cooldown
 * - SMS: Shows masked phone, resend button with cooldown
 * - BACKUP_CODE: Shows backup code hint, no resend, alphanumeric input
 *
 * Submit behavior:
 * - First attempt: Auto-submit when code is complete (smooth UX for copy-paste)
 * - After error: Manual submit required (prevents spam requests during correction)
 *
 * Uses shared CodeInputComponent for the actual input.
 *
 * Usage:
 * ```html
 * <app-verify-code
 *   [type]="'EMAIL'"
 *   [maskedDestination]="'j***@mail.com'"
 *   [isSubmitting]="isSubmitting()"
 *   [error]="error()"
 *   (codeSubmitted)="onCodeSubmitted($event)"
 *   (resendRequested)="onResend()">
 * </app-verify-code>
 * ```
 */
@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [CommonModule, CodeInputComponent, BackupCodeInputComponent],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss'
})
export class VerifyCodeComponent implements OnInit, OnDestroy, OnChanges {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** 2FA method type - determines UI behavior */
  @Input({ required: true }) type!: TwoFactorType;

  /** Masked destination for EMAIL/SMS (e.g., "j***@mail.com") */
  @Input() maskedDestination?: string;

  /** Disable input during submission */
  @Input() isSubmitting = false;

  /** Error message to display */
  @Input() error: string | null = null;

  /** Initial cooldown for resend (default from config) */
  @Input() initialCooldown?: number;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  /** Emitted when user completes code entry */
  @Output() codeSubmitted = new EventEmitter<string>();

  /** Emitted when user requests code resend */
  @Output() resendRequested = new EventEmitter<void>();

  // ===========================================================================
  // VIEW CHILDREN
  // ===========================================================================

  @ViewChild(CodeInputComponent) codeInput!: CodeInputComponent;

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Resend cooldown timer (seconds remaining) */
  resendCooldown = signal(0);

  /** Whether resend is in progress */
  isResending = signal(false);

  /** Whether manual submit is required (after first failed attempt) */
  requireManualSubmit = signal(false);

  /** Stored code for manual submission */
  pendingCode = signal<string | null>(null);

  /** Cooldown interval reference */
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Code length based on type */
  codeLength = computed(() => {
    try {
      if (!this.type) return 6;
      const config = getTwoFactorConfig(this.type);
      return config.codeLength;
    } catch (e) {
      console.error('Error getting code length:', e);
      return 6;
    }
  });

  /** Input type based on 2FA type */
  inputType = computed(() => {
    try {
      if (!this.type) return 'numeric';
      return getTwoFactorConfig(this.type).inputType;
    } catch {
      return 'numeric';
    }
  });

  /** Whether this type supports code resend */
  canResend = computed(() => {
    try {
      if (!this.type) return false;
      return getTwoFactorConfig(this.type).canResend;
    } catch {
      return false;
    }
  });

  /** Default cooldown duration for this type */
  defaultCooldown = computed(() => {
    try {
      if (!this.type) return 0;
      return getTwoFactorConfig(this.type).resendCooldown;
    } catch {
      return 0;
    }
  });

  /** Whether auto-submit is enabled (only on first attempt) */
  autoSubmitEnabled = computed(() => !this.requireManualSubmit());

  /** Whether the verify button should be enabled */
  canManualSubmit = computed(() => {
    const code = this.pendingCode();
    return code !== null && code.length === this.codeLength() && !this.isSubmitting;
  });

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    // Start initial cooldown for resendable types
    if (this.canResend()) {
      const cooldown = this.initialCooldown ?? this.defaultCooldown();
      this.startCooldown(cooldown);
    }
  }

  ngOnDestroy(): void {
    this.clearCooldownInterval();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Detect error changes to switch to manual submit mode
    if (changes['error'] && this.error) {
      this.requireManualSubmit.set(true);
      this.pendingCode.set(null);
    }
  }

  // ===========================================================================
  // CODE HANDLING
  // ===========================================================================

  /**
   * Handle code completion from CodeInputComponent.
   * Auto-submits on first attempt, stores code for manual submit after error.
   */
  onCodeComplete(code: string): void {
    if (this.isSubmitting) return;

    if (this.requireManualSubmit()) {
      // After error: store code, wait for manual submit
      this.pendingCode.set(code);
    } else {
      // First attempt: auto-submit
      this.codeSubmitted.emit(code);
    }
  }

  /**
   * Handle code change from CodeInputComponent.
   * Updates pending code for manual submission.
   */
  onCodeChange(code: string): void {
    if (this.requireManualSubmit()) {
      this.pendingCode.set(code);
    }
  }

  /**
   * Handle manual verify button click.
   * Used after a failed attempt when auto-submit is disabled.
   */
  onManualSubmit(): void {
    const code = this.pendingCode() || this.codeInput?.getCode();
    if (code && code.length === this.codeLength() && !this.isSubmitting) {
      this.codeSubmitted.emit(code);
    }
  }

  // ===========================================================================
  // RESEND HANDLING
  // ===========================================================================

  /**
   * Handle resend button click.
   */
  onResendClick(): void {
    if (this.resendCooldown() > 0 || this.isResending()) return;

    this.isResending.set(true);
    this.resendRequested.emit();
  }

  /**
   * Called by parent after resend completes.
   * Restarts the cooldown timer and resets to auto-submit mode.
   */
  onResendComplete(success: boolean): void {
    this.isResending.set(false);
    if (success) {
      this.startCooldown(this.defaultCooldown());
      this.fullReset();
    }
  }

  // ===========================================================================
  // RESET METHODS
  // ===========================================================================

  /**
   * Reset the code input (keeps manual submit state).
   */
  resetInput(): void {
    this.codeInput?.reset();
    this.pendingCode.set(null);
  }

  /**
   * Full reset including manual submit state.
   * Called when a new code is sent (resend).
   */
  fullReset(): void {
    this.codeInput?.reset();
    this.pendingCode.set(null);
    this.requireManualSubmit.set(false);
  }

  /**
   * Focus the code input.
   */
  focusInput(): void {
    this.codeInput?.focus();
  }

  // ===========================================================================
  // UI HELPERS
  // ===========================================================================

  /**
   * Get the title text based on 2FA type.
   */
  getTitle(): string {
    const titles: Record<TwoFactorType, string> = {
      TOTP: 'Enter authenticator code',
      EMAIL: 'Check your email',
      SMS: 'Check your phone',
      BACKUP_CODES: 'Enter backup code',
      WEBAUTHN: 'Use your security key'
    };
    return titles[this.type] ?? 'Enter verification code';
  }

  /**
   * Get the description text based on 2FA type.
   */
  getDescription(): string {
    switch (this.type) {
      case 'TOTP':
        return 'Enter the 6-digit code from your authenticator app';
      case 'EMAIL':
        return this.maskedDestination
          ? `We sent a code to ${this.maskedDestination}`
          : 'We sent a verification code to your email';
      case 'SMS':
        return this.maskedDestination
          ? `We sent a code to ${this.maskedDestination}`
          : 'We sent a verification code to your phone';
      case 'BACKUP_CODES':
        return 'Enter one of your saved backup codes';
      default:
        return 'Enter your verification code';
    }
  }

  /**
   * Get icon for the 2FA type.
   */
  getIcon(): string {
    const icons: Record<TwoFactorType, string> = {
      TOTP: '🔐',
      EMAIL: '📧',
      SMS: '📱',
      BACKUP_CODES: '🔑',
      WEBAUTHN: '🛡️'
    };
    return icons[this.type] ?? '🔒';
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Start the resend cooldown timer.
   */
  private startCooldown(seconds: number): void {
    this.clearCooldownInterval();
    this.resendCooldown.set(seconds);

    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        this.clearCooldownInterval();
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  /**
   * Clear the cooldown interval.
   */
  private clearCooldownInterval(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }
}
