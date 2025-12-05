// src/app/core/auth/services/two-factor-api.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpUtilService } from '../../http/http-util.service';
import { AuthOperationResponse } from '../models/auth-response.model';
import {
  TwoFactorType,
  TwoFactorMethod,
  TwoFactorStatusResponse,
  TwoFactorOperationResponse,
  TwoFactorMethodChosenResponse,
  TwoFactorVerifyRequest,
  TotpSetupResponse,
  BackupCodesSetupResponse,
} from '../models/two-factor.model';

/**
 * TwoFactorApiService - HTTP calls for two-factor authentication.
 *
 * Handles all 2FA-related API communication:
 * - Login flow: choose method, verify code, resend
 * - Settings: enable/disable methods for each type
 *
 * Responsibilities:
 * - Make HTTP requests to 2FA endpoints
 * - Return typed Observables
 *
 * Does NOT handle:
 * - State management (handled by components or AuthFacade)
 * - Side effects like navigation (handled by AuthFacade)
 * - Error transformation (handled by interceptor)
 */
@Injectable({ providedIn: 'root' })
export class TwoFactorApiService {

  private readonly http = inject(HttpUtilService);
  private readonly baseUrl = '/api/auth';

  // ===========================================================================
  // LOGIN FLOW (anonymous - during authentication)
  // ===========================================================================

  /**
   * Get current 2FA status during login flow.
   * Uses 2fa_token cookie for context.
   */
  getStatus(): Observable<TwoFactorStatusResponse> {
    return this.http.get<TwoFactorStatusResponse>(`${this.baseUrl}/2fa-status`);
  }

  /**
   * Get available 2FA methods for the current login session.
   * Uses 2fa_session_token cookie for context.
   */
  getAvailableMethodsForLogin(): Observable<TwoFactorMethod[]> {
    return this.http.get<TwoFactorMethod[]>(`${this.baseUrl}/2fa/enabled-methods`);
  }

  /**
   * Choose a 2FA method to use for verification.
   * Triggers code generation/sending for EMAIL and SMS.
   */
  chooseMethod(type: TwoFactorType): Observable<TwoFactorMethodChosenResponse> {
    return this.http.post<TwoFactorMethodChosenResponse>(
      `${this.baseUrl}/2fa/choose-method`,
      { twoFactorType: type }
    );
  }

  /**
   * Verify 2FA code and complete login.
   * On success, backend sets auth cookies.
   */
  verify(request: TwoFactorVerifyRequest): Observable<AuthOperationResponse> {
    return this.http.post<AuthOperationResponse>(`${this.baseUrl}/verify-2fa`, request);
  }

  /**
   * Resend verification code (EMAIL and SMS only).
   * Uses 2fa_token cookie for context.
   */
  resendCode(): Observable<AuthOperationResponse> {
    return this.http.post<AuthOperationResponse>(`${this.baseUrl}/resend-2fa-code`, {});
  }

  // ===========================================================================
  // SETTINGS - QUERY (authenticated)
  // ===========================================================================

  /**
   * Get all enabled 2FA methods for the authenticated user.
   * Used in security settings to display configured methods.
   */
  getEnabledMethods(): Observable<TwoFactorMethod[]> {
    return this.http.get<TwoFactorMethod[]>(`${this.baseUrl}/2fa/available-methods`);
  }

  // ===========================================================================
  // SETTINGS - TOTP (authenticated)
  // ===========================================================================

  /**
   * Enable TOTP 2FA.
   * Returns setup info including secret key and QR code URI.
   */
  enableTotp(): Observable<TotpSetupResponse> {
    return this.http.post<TotpSetupResponse>(`${this.baseUrl}/2fa/totp/enable`, {});
  }

  /**
   * Disable TOTP 2FA.
   */
  disableTotp(): Observable<TwoFactorOperationResponse> {
    return this.http.post<TwoFactorOperationResponse>(`${this.baseUrl}/2fa/totp/disable`, {});
  }

  // ===========================================================================
  // SETTINGS - EMAIL (authenticated)
  // ===========================================================================

  /**
   * Enable Email 2FA.
   * Uses the user's primary email address.
   */
  enableEmail(): Observable<TwoFactorOperationResponse> {
    return this.http.post<TwoFactorOperationResponse>(`${this.baseUrl}/2fa/email/enable`, {});
  }

  /**
   * Disable Email 2FA.
   */
  disableEmail(): Observable<TwoFactorOperationResponse> {
    return this.http.post<TwoFactorOperationResponse>(`${this.baseUrl}/2fa/email/disable`, {});
  }

  // ===========================================================================
  // SETTINGS - SMS (authenticated)
  // ===========================================================================

  /**
   * Enable SMS 2FA.
   * Requires a verified phone number.
   */
  enableSms(): Observable<TwoFactorOperationResponse> {
    return this.http.post<TwoFactorOperationResponse>(`${this.baseUrl}/2fa/sms/enable`, {});
  }

  /**
   * Disable SMS 2FA.
   */
  disableSms(): Observable<TwoFactorOperationResponse> {
    return this.http.post<TwoFactorOperationResponse>(`${this.baseUrl}/2fa/sms/disable`, {});
  }

  // ===========================================================================
  // SETTINGS - BACKUP CODES (authenticated)
  // ===========================================================================

  /**
   * Enable Backup Codes 2FA.
   * Returns the generated codes (shown only once).
   */
  enableBackupCodes(): Observable<BackupCodesSetupResponse> {
    return this.http.post<BackupCodesSetupResponse>(`${this.baseUrl}/2fa/backup-codes/enable`, {});
  }

  /**
   * Disable Backup Codes 2FA.
   */
  disableBackupCodes(): Observable<TwoFactorOperationResponse> {
    return this.http.post<TwoFactorOperationResponse>(`${this.baseUrl}/2fa/backup-codes/disable`, {});
  }

  // ===========================================================================
  // SETTINGS - GENERIC (authenticated)
  // ===========================================================================

  /**
   * Enable a 2FA method by type.
   * Convenience method that routes to the appropriate enable endpoint.
   *
   * Note: Returns different response types based on method:
   * - TOTP: TotpSetupResponse
   * - BACKUP_CODE: BackupCodesSetupResponse
   * - Others: TwoFactorOperationResponse
   */
  enableMethod(type: TwoFactorType): Observable<TwoFactorOperationResponse | TotpSetupResponse | BackupCodesSetupResponse> {
    switch (type) {
      case 'TOTP':
        return this.enableTotp();
      case 'EMAIL':
        return this.enableEmail();
      case 'SMS':
        return this.enableSms();
      case 'BACKUP_CODES':
        return this.enableBackupCodes();
      default:
        throw new Error(`Unsupported 2FA type: ${type}`);
    }
  }

  /**
   * Disable a 2FA method by type.
   * Convenience method that routes to the appropriate disable endpoint.
   */
  disableMethod(type: TwoFactorType): Observable<TwoFactorOperationResponse> {
    switch (type) {
      case 'TOTP':
        return this.disableTotp();
      case 'EMAIL':
        return this.disableEmail();
      case 'SMS':
        return this.disableSms();
      case 'BACKUP_CODES':
        return this.disableBackupCodes();
      default:
        throw new Error(`Unsupported 2FA type: ${type}`);
    }
  }
}
