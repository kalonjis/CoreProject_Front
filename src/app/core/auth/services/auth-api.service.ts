import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpUtilService } from '../../http/http-util.service';
import { UserSession } from '../models/user-session.model';
import { LoginRequest, TwoFactorVerifyRequest } from '../models/login-request.model';
import {
  AuthOperationResponse,
  AuthStatusResponse,
  TwoFactorStatusResponse
} from '../models/auth-response.model';

/**
 * AuthApiService - HTTP calls for authentication.
 *
 * Responsibilities:
 * - Make HTTP requests to auth endpoints
 * - Return typed Observables
 *
 * Does NOT handle:
 * - State management (see AuthStore)
 * - Side effects like navigation (see AuthFacade)
 * - Error transformation (handled by interceptor or facade)
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {

  private readonly http = inject(HttpUtilService);
  private readonly baseUrl = '/api/auth';

  // =========================================================================
  // AUTHENTICATION
  // =========================================================================

  /** Standard login (without 2FA flow) */
  login(credentials: LoginRequest): Observable<AuthOperationResponse> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  /** Initiate login (with 2FA check) */
  initiateLogin(credentials: LoginRequest): Observable<AuthOperationResponse> {
    return this.http.post(`${this.baseUrl}/initiate-login`, credentials);
  }

  /** Logout current session */
  logout(): Observable<AuthOperationResponse> {
    return this.http.post(`${this.baseUrl}/logout`, {});
  }

  /** Refresh access token using refresh token cookie (skips interceptor) */
  refreshToken(): Observable<AuthOperationResponse> {
    return this.http.post(`${this.baseUrl}/refresh-token`, {}, true);
  }

  // =========================================================================
  // SESSION
  // =========================================================================

  /** Get current user session (lightweight) */
  getSession(): Observable<UserSession> {
    return this.http.get(`${this.baseUrl}/session`);
  }

  /** Quick auth status check */
  getStatus(): Observable<AuthStatusResponse> {
    return this.http.get(`${this.baseUrl}/status`);
  }

  // =========================================================================
  // TWO-FACTOR AUTHENTICATION
  // =========================================================================

  /** Get 2FA status during login flow */
  getTwoFactorStatus(): Observable<TwoFactorStatusResponse> {
    return this.http.get(`${this.baseUrl}/2fa-status`);
  }

  /** Verify 2FA code and complete login */
  verifyTwoFactor(request: TwoFactorVerifyRequest): Observable<AuthOperationResponse> {
    return this.http.post(`${this.baseUrl}/verify-2fa`, request);
  }

  /** Resend 2FA verification code */
  resendTwoFactorCode(): Observable<AuthOperationResponse> {
    return this.http.post(`${this.baseUrl}/resend-2fa-code`, {});
  }
}
