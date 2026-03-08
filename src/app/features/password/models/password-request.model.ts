/**
 * Request to initiate password reset.
 * The reset type is now determined by the endpoint:
 *   POST /api/password/forgot/email-link
 *   POST /api/password/forgot/email-code
 *   POST /api/password/forgot/sms-code
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Request to reset password using email token (EMAIL_LINK flow).
 * PUT /api/password/reset?token=xxx
 */
export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

/**
 * Request to reset password using permission cookie (EMAIL_CODE + SMS_CODE flows).
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
 * Request to define a first password (OAuth users).
 * PUT /api/password/define
 */
export interface DefinePasswordRequest {
  password: string;
  confirmPassword: string;
}

/**
 * Request to verify a 6-digit code (EMAIL_CODE + SMS_CODE flows).
 * POST /api/password/verify-code
 */
export interface VerifyCodeRequest {
  verificationCode: string;
}
