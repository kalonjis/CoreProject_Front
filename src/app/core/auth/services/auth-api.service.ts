// src/app/core/auth/services/auth-api.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpUtilService } from '../../http/http-util.service';
import { UserSession } from '../models/user-session.model';
import { LoginRequest } from '../models/login-request.model';
import { AuthOperationResponse, AuthStatusResponse } from '../models/auth-response.model';

/**
 * AuthApiService - HTTP calls for authentication.
 *
 * Handles core authentication API communication:
 * - Login/logout
 * - Session management
 * - Token refresh
 *
 * Responsibilities:
 * - Make HTTP requests to auth endpoints
 * - Return typed Observables
 *
 * Does NOT handle:
 * - State management (see AuthStore)
 * - Side effects like navigation (see AuthFacade)
 * - Error transformation (handled by interceptor or facade)
 * - Two-factor authentication (see TwoFactorApiService)
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {

  private readonly http = inject(HttpUtilService);
  private readonly baseUrl = '/api/auth';

  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================

  /**
   * Standard login (without 2FA flow).
   * Use when 2FA is not enabled for the user.
   */
  login(credentials: LoginRequest): Observable<AuthOperationResponse> {
    return this.http.post<AuthOperationResponse>(`${this.baseUrl}/login`, credentials);
  }

  /**
   * Initiate login (with 2FA check).
   * Returns whether 2FA is required. If so, use TwoFactorApiService to continue.
   */
  initiateLogin(credentials: LoginRequest): Observable<AuthOperationResponse> {
    return this.http.post<AuthOperationResponse>(`${this.baseUrl}/initiate-login`, credentials);
  }

  /**
   * Logout current session.
   * Invalidates tokens server-side.
   */
  logout(): Observable<AuthOperationResponse> {
    return this.http.post<AuthOperationResponse>(`${this.baseUrl}/logout`, {});
  }

  /**
   * Refresh access token using refresh token cookie.
   * Skips interceptor to avoid infinite loop.
   */
  refreshToken(): Observable<AuthOperationResponse> {
    return this.http.post<AuthOperationResponse>(`${this.baseUrl}/refresh-token`, {}, true);
  }

  // ===========================================================================
  // SESSION
  // ===========================================================================

  /**
   * Get current user session.
   * Returns full user data for authenticated users.
   */
  getSession(): Observable<UserSession> {
    return this.http.get<UserSession>(`${this.baseUrl}/session`);
  }

  /**
   * Quick auth status check.
   * Lightweight alternative to getSession for simple auth verification.
   */
  getStatus(): Observable<AuthStatusResponse> {
    return this.http.get<AuthStatusResponse>(`${this.baseUrl}/status`);
  }
}
