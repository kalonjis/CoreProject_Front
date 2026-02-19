// src/app/features/account/models/signup-request.model.ts

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
