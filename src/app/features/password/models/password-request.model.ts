/**
 * Notification type for password reset delivery.
 */
export type NotificationType = 'EMAIL' | 'SMS';

/**
 * Request to initiate password reset (forgot password).
 * POST /api/password/forgot
 */
export interface ForgotPasswordRequest {
  email: string;
  notificationType: NotificationType;
}

/**
 * Request to reset password using email token.
 * PUT /api/password/reset?token=xxx
 */
export interface ResetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Request to reset password using SMS permission.
 * PUT /api/password/reset-with-permission
 */
export interface ResetPasswordWithPermissionRequest {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Request to change password (authenticated user).
 * PUT /api/password/change
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Request to verify SMS code for password reset.
 * POST /api/password/verify-sms-code
 */
export interface VerifySmsCodeRequest {
  verificationCode: string;
}
