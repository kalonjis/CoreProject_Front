// src/app/core/auth/services/auth.facade.ts

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, finalize, switchMap } from 'rxjs';

import { AuthStore } from '../state/auth.store';
import { AuthApiService } from './auth-api.service';
import { TwoFactorApiService } from './two-factor-api.service';
import { DeviceStore } from '../../device/state/device.store';
import { DeviceApiService } from '../../device/services/device-api.service';
import { AuthSyncService } from './auth-sync.service';

import { LoginRequest } from '../models/login-request.model';
import { AuthOperationResponse } from '../models/auth-response.model';
import { UserSession } from '../models/user-session.model';
import {
  TwoFactorType,
  TwoFactorMethod,
  TWO_FACTOR_REQUIRED_MESSAGE,
  TwoFactorMethodChosenResponse,
  buildVerifyRequest
} from '../models/two-factor.model';

/**
 * AuthFacade - Single entry point for authentication operations.
 *
 * Responsibilities:
 * - Orchestrate auth flows (login, logout, refresh, 2FA)
 * - Coordinate AuthStore, DeviceStore, and API services
 * - Handle side effects (navigation, sync)
 * - Expose reactive state for components
 *
 * Components should ONLY interact with this facade, never directly
 * with stores or API services.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {

  // Dependencies
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly authApi = inject(AuthApiService);
  private readonly twoFactorApi = inject(TwoFactorApiService);
  private readonly deviceStore = inject(DeviceStore);
  private readonly deviceApi = inject(DeviceApiService);
  private readonly syncService = inject(AuthSyncService);

  // ===========================================================================
  // EXPOSED STATE (readonly)
  // ===========================================================================

  // Auth state
  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly isInitialized = this.authStore.isInitialized;
  readonly isLoading = this.authStore.isLoading;
  readonly user = this.authStore.user;
  readonly error = this.authStore.error;
  readonly username = this.authStore.username;
  readonly displayName = this.authStore.displayName;
  readonly roles = this.authStore.roles;
  readonly isAdmin = this.authStore.isAdmin;
  readonly mustChangePassword = this.authStore.mustChangePassword;
  readonly twoFactorEnabled = this.authStore.twoFactorEnabled;

  // Device state
  readonly currentDevice = this.deviceStore.currentDevice;
  readonly isDeviceConfirmed = this.deviceStore.isConfirmed;
  readonly isDeviceBlacklisted = this.deviceStore.isBlacklisted;
  readonly deviceTrustLevel = this.deviceStore.trustLevel;

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize auth state on app bootstrap.
   * Checks if user has valid session and loads user/device data.
   */
  initialize(): Promise<void> {
    this.authStore.setLoading(true);

    return new Promise(resolve => {
      this.authApi.getSession().pipe(
        tap(user => {
          this.authStore.setUser(user);
          console.log('✅ AuthStore populated:', user);
          this.loadDeviceSession();
          this.syncService.startListening();
        }),
        catchError(() => {
          this.authStore.setInitialized();
          return throwError(() => 'Not authenticated');
        }),
        finalize(() => resolve())
      ).subscribe();
    });
  }

  // ===========================================================================
  // AUTHENTICATION - STANDARD LOGIN
  // ===========================================================================

  /**
   * Standard login with username/password (without 2FA).
   * Use this when you know 2FA is not enabled for the user.
   *
   * On success: loads user session, device, handles mustChangePassword redirect.
   *
   * @param credentials - Username and password
   * @param returnUrl - URL to redirect after successful login (default: '/')
   * @returns Observable that completes after login and navigation
   */
  login(credentials: LoginRequest, returnUrl: string = '/'): Observable<AuthOperationResponse> {
    this.authStore.setLoading(true);
    this.authStore.clearError();

    return this.authApi.login(credentials).pipe(
      switchMap(() => this.authApi.getSession()),
      tap(user => {
        this.authStore.setUser(user);
        this.loadDeviceSession();
        this.syncService.broadcastLogin();
        this.syncService.startListening();
      }),
      switchMap(() => {
        this.navigateAfterLogin(returnUrl);
        return [{ message: 'Login successful' } as AuthOperationResponse];
      }),
      catchError(err => this.handleLoginError(err))
    );
  }


  // ===========================================================================
  // AUTHENTICATION - TWO-FACTOR LOGIN FLOW
  // ===========================================================================

  /**
   * Initiate login with 2FA check.
   * Returns whether 2FA is required. If so, navigates to 2FA page.
   *
   * @param credentials - Username and password
   * @param returnUrl - URL to redirect after successful login
   * @returns Observable with response indicating if 2FA is required
   */
  initiateLogin(credentials: LoginRequest, returnUrl: string = '/'): Observable<AuthOperationResponse> {
    this.authStore.setLoading(true);
    this.authStore.clearError();

    return this.authApi.initiateLogin(credentials).pipe(
      tap(response => {
        this.authStore.setLoading(false);

        // Check if 2FA is required based on response message
        if (response.message === TWO_FACTOR_REQUIRED_MESSAGE) {
          // Navigate to 2FA page with returnUrl preserved
          this.router.navigate(['/auth/two-factor'], {
            queryParams: { returnUrl }
          });
        } else {
          // No 2FA required - complete login
          this.completeLoginAfterAuth(returnUrl);
        }
      }),
      catchError(err => this.handleLoginError(err))
    );
  }

  /**
   * Get available 2FA methods for the current login session.
   * Called by TwoFactorContainer to display method options.
   */
  getAvailable2FAMethods(): Observable<TwoFactorMethod[]> {
    return this.twoFactorApi.getAvailableMethodsForLogin();
  }

  /**
   * Choose a 2FA method to use for verification.
   * Triggers code generation/sending for EMAIL and SMS.
   *
   * @param type - The 2FA method type to use
   * @returns Observable with method chosen response (includes masked destination)
   */
  choose2FAMethod(type: TwoFactorType): Observable<TwoFactorMethodChosenResponse> {
    return this.twoFactorApi.chooseMethod(type);
  }

  /**
   * Verify 2FA code and complete login.
   * On success: loads user session and navigates to returnUrl.
   *
   * @param code - The verification code entered by user
   * @param type - The 2FA method type (determines request format)
   * @param returnUrl - URL to redirect after successful verification
   * @returns Observable that completes after verification and navigation
   */
  verify2FAAndCompleteLogin(
    code: string,
    type: TwoFactorType,
    returnUrl: string = '/'
  ): Observable<AuthOperationResponse> {
    const request = buildVerifyRequest(code, type);

    return this.twoFactorApi.verify(request).pipe(
      switchMap(() => this.authApi.getSession()),
      tap(user => {
        this.authStore.setUser(user);
        this.loadDeviceSession();
        this.syncService.broadcastLogin();
        this.syncService.startListening();
      }),
      switchMap(() => {
        this.navigateAfterLogin(returnUrl);
        return [{ message: '2FA verification successful' } as AuthOperationResponse];
      }),
      catchError(err => {
        const message = err.error?.message || 'Invalid verification code';
        return throwError(() => ({ ...err, message }));
      })
    );
  }

  /**
   * Resend 2FA verification code (EMAIL and SMS only).
   *
   * @returns Observable that completes when code is resent
   */
  resend2FACode(): Observable<AuthOperationResponse> {
    return this.twoFactorApi.resendCode();
  }

  // ===========================================================================
  // AUTHENTICATION - LOGOUT
  // ===========================================================================

  /**
   * Logout current session.
   * Clears all state and navigates to login.
   */
  logout(): Observable<AuthOperationResponse> {
    this.authStore.setLoading(true);

    return this.authApi.logout().pipe(
      tap(() => {
        this.clearSession();
        this.syncService.broadcastLogout();
        this.router.navigate(['/auth/login']);
      }),
      catchError(err => {
        // Even if API fails, clear local session
        this.clearSession();
        this.router.navigate(['/auth/login']);
        return throwError(() => err);
      })
    );
  }

  /**
   * Refresh access token silently.
   * Called by interceptor on 401.
   */
  refreshToken(): Observable<AuthOperationResponse> {
    return this.authApi.refreshToken().pipe(
      switchMap(() => this.authApi.getSession()),
      tap(user => this.authStore.setUser(user)),
      switchMap(() => [{ message: 'Token refreshed' } as AuthOperationResponse]),
      catchError(err => {
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  // ===========================================================================
  // SESSION MANAGEMENT
  // ===========================================================================

  /**
   * Reload user session from server.
   * Useful after profile update.
   */
  reloadSession(): Observable<UserSession> {
    return this.authApi.getSession().pipe(
      tap(user => this.authStore.setUser(user))
    );
  }

  /**
   * Clear all session data (stores only, no API call).
   * Used on logout or session expiry.
   */
  clearSession(): void {
    this.authStore.reset();
    this.deviceStore.reset();
    this.syncService.stopListening();
  }

  // ===========================================================================
  // DEVICE MANAGEMENT
  // ===========================================================================

  /**
   * Load current device session.
   */
  loadDeviceSession(): void {
    this.deviceStore.setLoading(true);

    this.deviceApi.getSession().pipe(
      tap(device => this.deviceStore.setDevice(device)),
      catchError(err => {
        this.deviceStore.setError('Failed to load device');
        return throwError(() => err);
      })
    ).subscribe();
  }

  /**
   * Reload device session from server.
   */
  reloadDeviceSession(): Observable<void> {
    return this.deviceApi.getSession().pipe(
      tap(device => this.deviceStore.setDevice(device)),
      switchMap(() => [void 0])
    );
  }

  // ===========================================================================
  // ROLE HELPERS
  // ===========================================================================

  hasRole = this.authStore.hasRole.bind(this.authStore);
  hasAnyRole = this.authStore.hasAnyRole.bind(this.authStore);
  hasTrustLevel = this.deviceStore.hasTrustLevel.bind(this.deviceStore);

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Navigate after successful authentication.
   * Handles mustChangePassword redirect.
   */
  private navigateAfterLogin(returnUrl: string): void {
    if (this.authStore.mustChangePassword()) {
      this.router.navigate(['/password/change'], {
        queryParams: { forced: 'true', returnUrl }
      });
    } else {
      this.router.navigateByUrl(returnUrl);
    }
  }

  /**
   * Complete login flow after authentication (load session, navigate).
   * Used when initiateLogin returns success without 2FA.
   */
  private completeLoginAfterAuth(returnUrl: string): void {
    this.authApi.getSession().pipe(
      tap(user => {
        this.authStore.setUser(user);
        this.loadDeviceSession();
        this.syncService.broadcastLogin();
        this.syncService.startListening();
      }),
      tap(() => this.navigateAfterLogin(returnUrl))
    ).subscribe();
  }

  /**
   * Handle login errors consistently.
   */
  private handleLoginError(err: any): Observable<never> {
    const message = err.error?.message || err.error?.error || 'Login failed';
    this.authStore.setError(message);
    this.authStore.setLoading(false);
    return throwError(() => err);
  }
}
