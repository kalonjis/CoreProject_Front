/**
 * Request payload for account signup.
 * POST /api/account/signup
 */
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Request payload for account deactivation.
 * POST /api/account/request-deactivation
 */
export interface DeactivateAccountRequest {
  reason: string;
  feedback?: string;
}

/**
 * Request payload for account reactivation.
 * POST /api/account/request-reactivation
 */
export interface ReactivateAccountRequest {
  email: string;
}
