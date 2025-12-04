// src/app/core/auth/models/two-factor.model.ts

/**
 * Two-Factor Authentication Models
 *
 * This file contains all types related to 2FA operations:
 * - Login flow (choose method, verify code)
 * - Settings (enable/disable methods)
 * - Shared types (method info, responses)
 *
 * Maps to backend DTOs in:
 * - TwoFactorAuthDTO.java
 * - TwoFactorOperationResponse.java
 * - TwoFactorVerificationRequest.java
 * - ChooseTwoFactorMethodRequest.java
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

/**
 * Available two-factor authentication method types.
 * Maps to: TwoFactorType.java
 */
export type TwoFactorType = 'EMAIL' | 'SMS' | 'TOTP' | 'BACKUP_CODE' | 'WEBAUTHN';

/**
 * Two-factor flow states for the login container state machine.
 */
export type TwoFactorFlowState =
  | 'loading'           // Fetching available methods
  | 'selecting'         // User choosing a method (when multiple available)
  | 'verifying'         // User entering verification code
  | 'success'           // Verification successful
  | 'error';            // Unrecoverable error

/**
 * Configuration for each 2FA type.
 * Used by verify-code component to adapt UI.
 */
export const TWO_FACTOR_CONFIG: Record<TwoFactorType, TwoFactorTypeConfig> = {
  EMAIL: {
    codeLength: 6,
    inputType: 'numeric',
    canResend: true,
    resendCooldown: 60,
  },
  SMS: {
    codeLength: 6,
    inputType: 'numeric',
    canResend: true,
    resendCooldown: 60,
  },
  TOTP: {
    codeLength: 6,
    inputType: 'numeric',
    canResend: false,
    resendCooldown: 0,
  },
  BACKUP_CODE: {
    codeLength: 16,
    inputType: 'alphanumeric',
    canResend: false,
    resendCooldown: 0,
  },
  WEBAUTHN: {
    codeLength: 0,
    inputType: 'numeric',
    canResend: false,
    resendCooldown: 0,
  },
};

// =============================================================================
// INTERFACES - SHARED
// =============================================================================

/**
 * Configuration for a 2FA type.
 */
export interface TwoFactorTypeConfig {
  codeLength: number;
  inputType: 'numeric' | 'alphanumeric';
  canResend: boolean;
  resendCooldown: number;
}

/**
 * Two-factor authentication method information.
 * Maps to: TwoFactorAuthDTO.java
 */
export interface TwoFactorMethod {
  userPublicId: string;
  type: TwoFactorType;
  displayName: string;
  description: string;
  isPrimary: boolean;
  isEnabled: boolean;
}

/**
 * Standard response for 2FA operations.
 * Maps to: TwoFactorOperationResponse.java
 */
export interface TwoFactorOperationResponse {
  message: string;
  type: TwoFactorType;
  status: 'enabled' | 'disabled' | 'verified' | 'method_chosen';
}

// =============================================================================
// INTERFACES - LOGIN FLOW
// =============================================================================

/**
 * Request to choose a 2FA method during login.
 * Maps to: ChooseTwoFactorMethodRequest.java
 */
export interface ChooseTwoFactorMethodRequest {
  twoFactorType: TwoFactorType;
}

/**
 * Response after choosing a 2FA method.
 * Contains info about what was sent/expected.
 */
export interface TwoFactorMethodChosenResponse {
  message: string;
  type: TwoFactorType;
  status: string;
  maskedDestination?: string; // e.g., "j***@mail.com" or "+32***789"
}

/**
 * Request to verify a 2FA code.
 * Maps to: TwoFactorVerificationRequest.java
 *
 * Note: Exactly one of verificationCode or backupCode must be provided.
 */
export interface TwoFactorVerifyRequest {
  verificationCode?: string; // 6 digits for EMAIL, SMS, TOTP
  backupCode?: string;       // Format: XXXX-XXXX-XXXX-XXXX
}

/**
 * Status response during 2FA login flow.
 * Maps to: GET /api/auth/2fa-status response
 */
export interface TwoFactorStatusResponse {
  twoFactorRequired: boolean;
  status: 'awaiting_verification' | '2fa_session' | 'no_2fa_session' | 'invalid_2fa_session';
  type?: TwoFactorType;
  maskedEmail?: string;
  maskedPhone?: string;
  timeRemaining?: number;
}

// =============================================================================
// INTERFACES - SETTINGS (enable/disable methods)
// =============================================================================

/**
 * Response when enabling TOTP 2FA.
 * Contains setup info for authenticator app.
 */
export interface TotpSetupResponse {
  secretKey: string;      // Base32 encoded secret
  qrCodeUri: string;      // otpauth:// URI for QR code
  manualEntryKey: string; // Human-readable key for manual entry
}

/**
 * Response when enabling backup codes 2FA.
 * Contains the generated codes (shown only once).
 */
export interface BackupCodesSetupResponse {
  backupCodes: string[]; // Array of codes in format XXXX-XXXX-XXXX-XXXX
  message: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the configuration for a given 2FA type.
 */
export function getTwoFactorConfig(type: TwoFactorType): TwoFactorTypeConfig {
  return TWO_FACTOR_CONFIG[type];
}

/**
 * Check if a 2FA type supports code resend.
 */
export function canResendCode(type: TwoFactorType): boolean {
  return TWO_FACTOR_CONFIG[type].canResend;
}

/**
 * Format a backup code with dashes for display.
 * Input: "ABCD1234EFGH5678" -> Output: "ABCD-1234-EFGH-5678"
 */
export function formatBackupCode(code: string): string {
  const clean = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join('-') ?? clean;
}

/**
 * Build a TwoFactorVerifyRequest from a code and type.
 */
export function buildVerifyRequest(code: string, type: TwoFactorType): TwoFactorVerifyRequest {
  if (type === 'BACKUP_CODE') {
    return { backupCode: formatBackupCode(code) };
  }
  return { verificationCode: code };
}


// Message constants (must match backend AuthOperationResponse)
export const TWO_FACTOR_REQUIRED_MESSAGE = 'Two-factor authentication required';
