/**
 * Generic response for auth operations (login, logout, refresh, 2FA).
 * Maps to: AuthOperationResponse.java
 */
export interface AuthOperationResponse {
  message: string;
}

/**
 * Response for GET /api/auth/status
 * Quick auth check without full user data.
 */
export interface AuthStatusResponse {
  isAuthenticated: boolean;
  username?: string;
  roles?: string[];
}

/**
 * Response for GET /api/auth/2fa-status
 * Used to check 2FA state during login flow.
 */
export interface TwoFactorStatusResponse {
  twoFactorRequired: boolean;
  status: '2fa_session' | 'awaiting_verification' | 'no_2fa_session' | 'invalid_2fa_session';
  type?: TwoFactorType;
  maskedEmail?: string;
  timeRemaining?: number;
}

/**
 * Two-factor authentication types.
 * Maps to: TwoFactorType.java
 */
export type TwoFactorType = 'EMAIL' | 'SMS' | 'TOTP' | 'BACKUP_CODE';
