// src/app/core/auth/models/auth-response.model.ts

/**
 * Generic response for auth operations (login, logout, refresh).
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
 * Re-export 2FA types from two-factor.model.ts
 * for backward compatibility with existing imports.
 */
export type { TwoFactorStatusResponse, TwoFactorType } from './two-factor.model';
