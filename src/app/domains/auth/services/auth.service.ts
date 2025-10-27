import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map, of } from 'rxjs';
import { HttpUtilService } from '../../../core/http/http-util.service';
import { AUTH_ROUTES, FRONTEND_ROUTES } from '../../../core/config/api-routes.constants';

// Models du domain auth
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { TwoFARequest } from '../models/two-fa-request';
import { TwoFAResponse } from '../models/two-fa-response';
import { ApiResponse } from '../models/api-response';
import { UserDTO } from '../../../data/models/user/user-dto';

/**
 * Authentication Service - Domain AUTH
 * Gère l'authentification et l'état de session utilisateur
 *
 * ✅ Utilise UNIQUEMENT des signals (moderne et performant)
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

  // =========================================================================
  // STATE MANAGEMENT avec SIGNALS
  // =========================================================================

  // Signals privés (writable)
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _currentUser = signal<UserDTO | null>(null);
  private readonly _isInitialized = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Signals publics (readonly) - Computed pour dérivation
  public readonly isAuthenticated = computed(() => this._isAuthenticated());
  public readonly currentUser = computed(() => this._currentUser());
  public readonly isInitialized = computed(() => this._isInitialized());
  public readonly isLoading = computed(() => this._isLoading());
  public readonly error = computed(() => this._error());
  public readonly username = computed(() => this._currentUser()?.username || null);
  public readonly mustChangePassword = computed(() => this._currentUser()?. || false);

  // Signals writable exposés (pour compatibilité avec ancien code si besoin)
  public readonly isAuthenticatedSignal = this._isAuthenticated.asReadonly();
  public readonly currentUserSignal = this._currentUser.asReadonly();

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  /**
   * Initialize authentication state on app startup
   * Called by APP_INITIALIZER in app.config.ts
   */
  initialize(): Promise<void> {
    console.log('🚀 AuthService initialization (with signals)');
    this._isLoading.set(true);

    return this.checkAuthStatus().toPromise().then(() => {
      this._isInitialized.set(true);
      this._isLoading.set(false);
      console.log('✅ AuthService initialized - isAuth:', this.isAuthenticated());
    }).catch(() => {
      this._isInitialized.set(true);
      this._isLoading.set(false);
      console.log('⚠️ AuthService initialized - not authenticated');
    });
  }

  /**
   * Check current authentication status
   * Route: GET /api/auth/status
   */
  checkAuthStatus(): Observable<boolean> {
    return this.http.get<{ authenticated: boolean }>(AUTH_ROUTES.STATUS).pipe(
      tap(response => {
        console.log('🔍 Auth status check:', response.authenticated);
        this.setAuthenticated(response.authenticated);
        if (response.authenticated) {
          this.loadCurrentUser();
        }
      }),
      map(response => response.authenticated),
      catchError(() => {
        console.log('❌ Auth status check failed');
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
      tap(user => {
        console.log('👤 User loaded:', user.username);
        this._currentUser.set(user);
        this._error.set(null);
      }),
      catchError((err) => {
        console.error('❌ Failed to load user:', err);
        this._currentUser.set(null);
        this._error.set('Failed to load user profile');
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
    console.log('🔐 Login attempt for:', request.username);
    this._isLoading.set(true);
    this._error.set(null);

    return this.httpUtil.post<LoginResponse>(
      AUTH_ROUTES.LOGIN,
      request,
      true // Skip interceptor
    ).pipe(
      tap(response => {
        console.log('✅ Login response:', response);
        if (response.success) {
          this.setAuthenticated(true);
          this.loadCurrentUser();
        }
        this._isLoading.set(false);
      }),
      catchError(err => {
        console.error('❌ Login failed:', err);
        this._isLoading.set(false);
        this._error.set(err.error?.message || 'Login failed');
        return throwError(() => err);
      })
    );
  }

  /**
   * Initiate 2FA login flow
   * Route: POST /api/auth/initiate-login
   * Public route - uses skipInterceptor
   */
  initiateLogin(request: LoginRequest): Observable<ApiResponse> {
    this._isLoading.set(true);

    return this.httpUtil.post<ApiResponse>(
      AUTH_ROUTES.INITIATE_LOGIN,
      request,
      true
    ).pipe(
      tap(() => this._isLoading.set(false)),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.error?.message || '2FA initiation failed');
        return throwError(() => err);
      })
    );
  }

  /**
   * Verify 2FA code
   * Route: POST /api/auth/verify-2fa
   * Public route - uses skipInterceptor
   */
  verify2FA(request: TwoFARequest): Observable<TwoFAResponse> {
    this._isLoading.set(true);

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
        this._isLoading.set(false);
      }),
      catchError(err => {
        this._isLoading.set(false);
        this._error.set(err.error?.message || '2FA verification failed');
        return throwError(() => err);
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
    console.log('🔄 Refreshing token');

    return this.httpUtil.post<ApiResponse>(
      AUTH_ROUTES.REFRESH_TOKEN,
      {},
      true // Skip interceptor to avoid infinite loop
    ).pipe(
      tap(() => {
        console.log('✅ Token refreshed');
        this.setAuthenticated(true);
      }),
      catchError(error => {
        console.error('❌ Token refresh failed');
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
    console.log('🚪 Logging out');
    this._isLoading.set(true);

    return this.http.post<ApiResponse>(AUTH_ROUTES.LOGOUT, {}).pipe(
      tap(() => {
        console.log('✅ Logged out successfully');
        this.clearSession();
        this._isLoading.set(false);
        this.router.navigate([FRONTEND_ROUTES.AUTH_LOGIN]);
      }),
      catchError(err => {
        console.warn('⚠️ Logout error, clearing session anyway');
        this.clearSession();
        this._isLoading.set(false);
        this.router.navigate([FRONTEND_ROUTES.AUTH_LOGIN]);
        return of({ success: true, message: 'Logged out' });
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
  // STATE MANAGEMENT - Méthodes Publiques
  // =========================================================================

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this._currentUser();
    return user?.userRoles?.includes(role as any) || false;
  }

  /**
   * Clear session without API call
   * Useful when handling auth errors
   */
  clearSession(): void {
    console.log('🧹 Clearing session');
    this.setAuthenticated(false);
    this._currentUser.set(null);
    this._error.set(null);
  }

  // =========================================================================
  // STATE MANAGEMENT - Méthodes Privées
  // =========================================================================

  /**
   * Set authentication state
   */
  private setAuthenticated(value: boolean): void {
    console.log('🔄 setAuthenticated:', value);
    this._isAuthenticated.set(value);

    if (!value) {
      this._currentUser.set(null);
    }
  }

  /**
   * Handle refresh token error
   * Clears authentication state and redirects to login
   */
  private handleRefreshTokenError(): void {
    console.warn('⚠️ Refresh token failed - clearing authentication state');
    this.clearSession();
    this.router.navigate([FRONTEND_ROUTES.AUTH_LOGIN]);
  }
}
