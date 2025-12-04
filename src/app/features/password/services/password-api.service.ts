import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpUtilService } from '../../../core/http/http-util.service';
import {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResetPasswordWithPermissionRequest,
  ChangePasswordRequest,
  VerifySmsCodeRequest
} from '../models/password-request.model';
import { PasswordOperationResponse } from '../models/password-response.model';

/**
 * PasswordApiService - HTTP calls for password operations.
 *
 * Endpoints:
 * - POST /api/password/forgot          → Request password reset (email or SMS)
 * - PUT  /api/password/reset           → Reset with email token
 * - PUT  /api/password/reset-with-permission → Reset with SMS permission
 * - PUT  /api/password/change          → Change password (authenticated)
 * - GET  /api/password/reset/resend    → Resend expired token
 * - POST /api/password/verify-code-code → Verify SMS code
 */
@Injectable({ providedIn: 'root' })
export class PasswordApiService {

  private readonly http = inject(HttpUtilService);
  private readonly baseUrl = '/api/password';

  // =========================================================================
  // FORGOT PASSWORD FLOW
  // =========================================================================

  /**
   * Request password reset via email or SMS.
   * Always returns success (security: prevents email enumeration).
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<PasswordOperationResponse> {
    return this.http.post(`${this.baseUrl}/forgot`, request);
  }

  /**
   * Resend password reset token (when expired).
   */
  resendResetToken(token: string): Observable<PasswordOperationResponse> {
    return this.http.get(`${this.baseUrl}/reset/resend?token=${encodeURIComponent(token)}`);
  }

  // TODO implements this in backend side
  //resendSmsCode()

  // =========================================================================
  // RESET PASSWORD
  // =========================================================================

  /**
   * Reset password using email token.
   */
  resetPassword(token: string, request: ResetPasswordRequest): Observable<PasswordOperationResponse> {
    return this.http.put(`${this.baseUrl}/reset?token=${encodeURIComponent(token)}`, request);
  }

  /**
   * Reset password using SMS permission (after SMS code verification).
   * Requires password_reset_permission cookie to be set.
   */
  resetPasswordWithPermission(request: ResetPasswordWithPermissionRequest): Observable<PasswordOperationResponse> {
    return this.http.put(`${this.baseUrl}/reset-with-permission`, request);
  }

  // =========================================================================
  // SMS VERIFICATION
  // =========================================================================

  /**
   * Verify SMS code for password reset.
   * On success, sets password_reset_permission cookie.
   */
  verifySmsCode(request: VerifySmsCodeRequest): Observable<PasswordOperationResponse> {
    return this.http.post(`${this.baseUrl}/verify
    -code`, request);
  }

  // =========================================================================
  // CHANGE PASSWORD (AUTHENTICATED)
  // =========================================================================

  /**
   * Change password for authenticated user.
   * Requires current password verification.
   */
  changePassword(request: ChangePasswordRequest): Observable<PasswordOperationResponse> {
    return this.http.put(`${this.baseUrl}/change`, request);
  }
}
