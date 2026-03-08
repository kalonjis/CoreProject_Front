import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpUtilService } from '../../../core/http/http-util.service';
import {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResetPasswordWithPermissionRequest,
  ChangePasswordRequest,
  VerifyCodeRequest,
  DefinePasswordRequest
} from '../models/password-request.model';
import { PasswordOperationResponse } from '../models/password-response.model';

/**
 * HTTP calls for password operations.
 *
 * Endpoints:
 *   POST /api/password/forgot/email-link     → Reset via email link
 *   POST /api/password/forgot/email-code     → Reset via email code
 *   POST /api/password/forgot/sms-code       → Reset via SMS code
 *   POST /api/password/verify-code           → Verify code (email-code + sms-code flows)
 *   PUT  /api/password/reset                 → Complete reset via token (email-link flow)
 *   PUT  /api/password/reset-with-permission → Complete reset via permission cookie
 *   GET  /api/password/reset/resend          → Resend expired email-link token
 *   PUT  /api/password/change                → Change password (authenticated)
 *   PUT  /api/password/define                → Define password (OAuth users)
 */
@Injectable({ providedIn: 'root' })
export class PasswordApiService {

  private readonly http = inject(HttpUtilService);
  private readonly baseUrl = '/api/password';

  // =========================================================================
  // FORGOT PASSWORD
  // =========================================================================

  forgotPasswordEmailLink(request: ForgotPasswordRequest): Observable<PasswordOperationResponse> {
    return this.http.post(`${this.baseUrl}/forgot/email-link`, request);
  }

  forgotPasswordEmailCode(request: ForgotPasswordRequest): Observable<PasswordOperationResponse> {
    return this.http.post(`${this.baseUrl}/forgot/email-code`, request);
  }

  forgotPasswordSmsCode(request: ForgotPasswordRequest): Observable<PasswordOperationResponse> {
    return this.http.post(`${this.baseUrl}/forgot/sms-code`, request);
  }

  // =========================================================================
  // CODE VERIFICATION
  // =========================================================================

  verifyCode(request: VerifyCodeRequest): Observable<PasswordOperationResponse> {
    return this.http.post(`${this.baseUrl}/verify-code`, request);
  }

  // =========================================================================
  // RESET PASSWORD
  // =========================================================================

  resetPassword(token: string, request: ResetPasswordRequest): Observable<PasswordOperationResponse> {
    return this.http.put(`${this.baseUrl}/reset?token=${encodeURIComponent(token)}`, request);
  }

  resetPasswordWithPermission(request: ResetPasswordWithPermissionRequest): Observable<PasswordOperationResponse> {
    return this.http.put(`${this.baseUrl}/reset-with-permission`, request);
  }

  resendResetToken(token: string): Observable<PasswordOperationResponse> {
    return this.http.get(`${this.baseUrl}/reset/resend?token=${encodeURIComponent(token)}`);
  }

  // =========================================================================
  // CHANGE / DEFINE PASSWORD
  // =========================================================================

  changePassword(request: ChangePasswordRequest): Observable<PasswordOperationResponse> {
    return this.http.put(`${this.baseUrl}/change`, request);
  }

  definePassword(request: DefinePasswordRequest): Observable<PasswordOperationResponse> {
    return this.http.put(`${this.baseUrl}/define`, request);
  }
}
