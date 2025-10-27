import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {Observable, BehaviorSubject, tap, catchError, of, throwError, map} from 'rxjs';
import { HttpUtilService } from '../../../core/http/http-util.service';
import { AUTH_ROUTES, FRONTEND_ROUTES } from '../../../core/config/api-routes.constants';

// Models du domain auth
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { TwoFARequest } from '../models/two-fa-request';
import { TwoFAResponse } from '../models/two-fa-response';
import { ApiResponse } from '../models/api-response';
import {UserDTO} from '../../../data/models/user/user-dto';

// Models du domain user (shared)

/**
 * Authentication Service - Domain AUTH
 * Gère l'authentification et l'état de session utilisateur
 *
 * Responsabilités (comme AuthController backend):
 * - Login/Logout
 * - Refresh token
 * - 2FA management
 * - Authentication state
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly httpUtil = inject(HttpUtilService);
  private readonly router = inject(Router);

  // State management
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private readonly currentUserSubject = new BehaviorSubject<UserDTO | null>(null);

  public readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  // Signal for reactive state
  public readonly isAuthenticatedSignal = signal<boolean>(false);

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  /**
   * Initialize authentication state on app startup
   * Called by APP_INITIALIZER in app.config.ts
   */
  initialize(): Promise<void> {
    return this.checkAuthStatus().toPromise().then(() => {});
  }

  /**
   * Check current authentication status
   * Route: GET /api/auth/status
   */
  checkAuthStatus(): Observable<boolean> {
    return this.http.get<{ authenticated: boolean }>(AUTH_ROUTES.STATUS).pipe(
      tap(response => {
        this.setAuthenticated(response.authenticated);
        if (response.authenticated) {
          this.loadCurrentUser();
        }
      }),
      // Mapper l'objet vers boolean pour correspondre au type de retour
      map(response => response.authenticated),
      catchError(() => {
        this.setAuthenticated(false);
        return of(false);
      })
    );
  }

  /**
   * Load current user details
   * Route: GET /api/auth/me
   */
  loadCurrentUser(): void {
    this.http.get<UserDTO>(AUTH_ROUTES.ME).pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      })
    ).subscribe();
  }

  // =========================================================================
  // PUBLIC AUTHENTICATION ENDPOINTS
  // =========================================================================

  /**
   * User login
   * Route: POST /api/auth/login
   * Public route - uses skipInterceptor
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.httpUtil.post<LoginResponse>(
      AUTH_ROUTES.LOGIN,
      request,
      true // Skip interceptor
    ).pipe(
      tap(response => {
        if (response.success) {
          this.setAuthenticated(true);
          this.loadCurrentUser();
        }
      })
    );
  }

  /**
   * Initiate 2FA login flow
   * Route: POST /api/auth/initiate-login
   * Public route - uses skipInterceptor
   */
  initiateLogin(request: LoginRequest): Observable<ApiResponse> {
    return this.httpUtil.post<ApiResponse>(
      AUTH_ROUTES.INITIATE_LOGIN,
      request,
      true
    );
  }

  /**
   * Verify 2FA code
   * Route: POST /api/auth/verify-2fa
   * Public route - uses skipInterceptor
   */
  verify2FA(request: TwoFARequest): Observable<TwoFAResponse> {
    return this.httpUtil.post<TwoFAResponse>(
      AUTH_ROUTES.VERIFY_2FA,
      request,
      true
    ).pipe(
      tap(response => {
        if (response.success) {
          this.setAuthenticated(true);
          this.loadCurrentUser();
        }
      })
    );
  }

  /**
   * Resend 2FA code
   * Route: POST /api/auth/resend-2fa-code
   * Public route - uses skipInterceptor
   */
  resend2FACode(): Observable<ApiResponse> {
    return this.httpUtil.post<ApiResponse>(
      AUTH_ROUTES.RESEND_2FA_CODE,
      {},
      true
    );
  }

  /**
   * Choose 2FA method
   * Route: POST /api/auth/2fa/choose-method
   * Public route - uses skipInterceptor
   */
  choose2FAMethod(method: string): Observable<ApiResponse> {
    return this.httpUtil.post<ApiResponse>(
      AUTH_ROUTES.CHOOSE_2FA_METHOD,
      { method },
      true
    );
  }

  /**
   * Refresh access token using refresh token from cookie
   * Route: POST /api/auth/refresh-token
   * CSRF protection active (uses cookies)
   */
  refreshToken(): Observable<ApiResponse> {
    return this.httpUtil.post<ApiResponse>(
      AUTH_ROUTES.REFRESH_TOKEN,
      {},
      true // Skip interceptor to avoid infinite loop
    ).pipe(
      tap(() => this.setAuthenticated(true)),
      catchError(error => {
        this.handleRefreshTokenError();
        return throwError(() => error);
      })
    );
  }

  // =========================================================================
  // AUTHENTICATED ENDPOINTS
  // =========================================================================

  /**
   * User logout
   * Route: POST /api/auth/logout
   * CSRF protection active
   */
  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(AUTH_ROUTES.LOGOUT, {}).pipe(
      tap(() => {
        this.setAuthenticated(false);
        this.currentUserSubject.next(null);
        this.router.navigate([FRONTEND_ROUTES.AUTH_LOGIN]);
      })
    );
  }

  /**
   * Get current user details
   * Route: GET /api/auth/me
   */
  getCurrentUser(): Observable<UserDTO> {
    return this.http.get<UserDTO>(AUTH_ROUTES.ME);
  }

  // =========================================================================
  // 2FA MANAGEMENT (AUTHENTICATED)
  // =========================================================================

  /**
   * Get available 2FA methods
   * Route: GET /api/auth/2fa/available-methods
   */
  getAvailable2FAMethods(): Observable<string[]> {
    return this.http.get<string[]>(AUTH_ROUTES.AVAILABLE_METHODS);
  }

  /**
   * Enable Email 2FA
   * Route: POST /api/auth/2fa/email/enable
   */
  enableEmail2FA(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(AUTH_ROUTES.EMAIL_2FA_ENABLE, {});
  }

  /**
   * Disable Email 2FA
   * Route: POST /api/auth/2fa/email/disable
   */
  disableEmail2FA(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(AUTH_ROUTES.EMAIL_2FA_DISABLE, {});
  }

  /**
   * Enable SMS 2FA
   * Route: POST /api/auth/2fa/sms/enable
   */
  enableSMS2FA(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(AUTH_ROUTES.SMS_2FA_ENABLE, {});
  }

  /**
   * Disable SMS 2FA
   * Route: POST /api/auth/2fa/sms/disable
   */
  disableSMS2FA(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(AUTH_ROUTES.SMS_2FA_DISABLE, {});
  }

  /**
   * Enable TOTP 2FA
   * Route: POST /api/auth/2fa/totp/enable
   */
  enableTOTP2FA(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(AUTH_ROUTES.TOTP_2FA_ENABLE, {});
  }

  /**
   * Disable TOTP 2FA
   * Route: POST /api/auth/2fa/totp/disable
   */
  disableTOTP2FA(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(AUTH_ROUTES.TOTP_2FA_DISABLE, {});
  }

  /**
   * Enable Backup Codes 2FA
   * Route: POST /api/auth/2fa/backup-codes/enable
   */
  enableBackupCodes2FA(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(AUTH_ROUTES.BACKUP_CODES_ENABLE, {});
  }

  /**
   * Disable Backup Codes 2FA
   * Route: POST /api/auth/2fa/backup-codes/disable
   */
  disableBackupCodes2FA(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(AUTH_ROUTES.BACKUP_CODES_DISABLE, {});
  }

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  /**
   * Set authentication state
   */
  private setAuthenticated(value: boolean): void {
    this.isAuthenticatedSubject.next(value);
    this.isAuthenticatedSignal.set(value);
  }

  /**
   * Get current authentication state (synchronous)
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get current user (synchronous)
   */
  getCurrentUserSync(): UserDTO | null {
    return this.currentUserSubject.value;
  }

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  /**
   * Handle refresh token error
   * Clears authentication state and redirects to login
   */
  private handleRefreshTokenError(): void {
    console.warn('Refresh token failed - clearing authentication state');
    this.setAuthenticated(false);
    this.currentUserSubject.next(null);
    this.router.navigate([FRONTEND_ROUTES.AUTH_LOGIN]);
  }
}
