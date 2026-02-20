import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpUtilService } from '../../../core/http/http-util.service';
import { AccountOperationResponse } from '../models/account-response.model';
import {DeactivateAccountRequest, ReactivateAccountRequest, SignupRequest} from '../models';

/**
 * AccountApiService - HTTP calls for account lifecycle operations.
 *
 * Responsibilities:
 * - Make HTTP requests to account endpoints
 * - Return typed Observables
 *
 * Does NOT handle:
 * - State management (not needed for account operations)
 * - Side effects (components handle navigation/feedback)
 */
@Injectable({ providedIn: 'root' })
export class AccountApiService {

  private readonly http = inject(HttpUtilService);
  private readonly baseUrl = '/api/account';

  // =========================================================================
  // SIGNUP & ACTIVATION
  // =========================================================================

  /**
   * Create new account via self-signup.
   * User receives confirmation email with activation link.
   *
   * POST /api/account/signup
   */
  signup(request: SignupRequest): Observable<AccountOperationResponse> {
    return this.http.post(`${this.baseUrl}/signup`, request);
  }

  /**
   * Activate account with token from confirmation email.
   * Token is extracted from email link query parameter.
   *
   * GET /api/account/activate?token=xxx
   */
  activateAccount(token: string): Observable<AccountOperationResponse> {
    return this.http.get(`${this.baseUrl}/activate?token=${token}`);
  }

  /**
   * Request new activation email when original token expires.
   * Requires the expired token to identify the user.
   *
   * GET /api/account/resend-activation?token=xxx
   */
  resendActivation(token: string): Observable<AccountOperationResponse> {
    return this.http.get(`${this.baseUrl}/resend-activation?token=${token}`);
  }


  /**
   * Request new activation email by email or username.
   * For users who try to login but never activated their account.
   *
   * POST /api/account/resend-activation-by-identifier
   */
  resendActivationByIdentifier(identifier: string): Observable<AccountOperationResponse> {
    return this.http.post(`${this.baseUrl}/resend-activation-by-identifier`, { identifier });
  }

  // =========================================================================
  // DEACTIVATION (authenticated users only)
  // =========================================================================

  /**
   * Request account deactivation.
   * User receives confirmation email with deactivation link.
   * Requires authentication.
   *
   * POST /api/account/request-deactivation
   */
  requestDeactivation(request: DeactivateAccountRequest): Observable<AccountOperationResponse> {
    return this.http.post(`${this.baseUrl}/request-deactivation`, request);
  }

  /**
   * Confirm account deactivation with token from email.
   * This actually deactivates the account.
   * Requires authentication.
   *
   * GET /api/account/confirm-deactivation?token=xxx
   */
  confirmDeactivation(token: string): Observable<AccountOperationResponse> {
    return this.http.get(`${this.baseUrl}/confirm-deactivation?token=${token}`);
  }

  // =========================================================================
  // REACTIVATION
  // =========================================================================

  /**
   * Request account reactivation.
   * User receives reactivation email with link.
   *
   * POST /api/account/request-reactivation
   */
  requestReactivation(request: ReactivateAccountRequest): Observable<AccountOperationResponse> {
    return this.http.post(`${this.baseUrl}/request-reactivation`, request);
  }

  /**
   * Confirm account reactivation with token from email.
   * This reactivates the account.
   *
   * GET /api/account/confirm-reactivation?token=xxx
   */
  confirmReactivation(token: string): Observable<AccountOperationResponse> {
    return this.http.get(`${this.baseUrl}/confirm-reactivation?token=${token}`);
  }
}
