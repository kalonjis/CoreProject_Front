/**
 * Notification type for password reset delivery.
 */
export type PasswordResetType = 'EMAIL_LINK' | 'EMAIL_CODE' | 'SMS_CODE';

/**
 * Request to initiate password reset (forgot password).
 * POST /api/password/forgot
 */
export interface ForgotPasswordRequest {
  email: string;
  resetType: PasswordResetType;
}

/**
 * Request to reset password using email token.
 * PUT /api/password/reset?token=xxx
 */
export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

/**
 * Request to reset password using SMS permission.
 * PUT /api/password/reset-with-permission
 */
export interface ResetPasswordWithPermissionRequest {
  password: string;
  confirmPassword: string;
}

/**
 * Request to change password (authenticated user).
 * PUT /api/password/change
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

/**
 * Request to verify SMS code for password reset.
 * POST /api/password/verify-code-code
 */
export interface VerifySmsCodeRequest {
  verificationCode: string;
}
