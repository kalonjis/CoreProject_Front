/**
 * Request payload for POST /api/auth/login
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Request payload for POST /api/auth/verify-2fa
export interface TwoFactorVerifyRequest {
  verificationCode?: string;
  backupCode?: string;
}
 */

/**
 * Request payload for POST /api/auth/resend-2fa-code
 * No body required - uses 2fa_token cookie
export type ResendTwoFactorRequest = void;
 */
