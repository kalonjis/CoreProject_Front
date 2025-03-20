import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, map, Observable, of, tap} from 'rxjs';
import {User} from '../../../data/models/user/user';
import {Router} from '@angular/router';
import {LoginForm} from '../../../data/models/auth/login-form';
import {ApiResponse} from '../../../data/models/auth/api-response';
import {UserSignupForm} from '../../../data/models/user/user-signup-form';
import {RequestPasswordForm} from '../../../data/models/auth/request-password-form';
import {PasswordResetForm} from '../../../data/models/auth/password-reset-form';
import {ChangePasswordForm} from '../../../data/models/auth/change-password-form';
import {ChangeEmailForm} from '../../../data/models/auth/change-email-form';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Current user information
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.checkInitialAuth();
  }

  /**
   * Check if user is already authenticated on app start
   */
  private checkInitialAuth(): void {
    if (this.hasValidToken()) {
      this.loadCurrentUser().subscribe();
    }
  }

  /**
   * Load current user data from API
   */
  loadCurrentUser(): Observable<User | null> {
    return this.http.get<User>('/api/auth/me').pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  /**
   * Login user with credentials
   */
  login(credentials: LoginForm): Observable<boolean> {
    return this.http.post<ApiResponse>('/api/auth/login', credentials).pipe(
      tap(() => {
        this.isAuthenticatedSubject.next(true);
        return this.loadCurrentUser().subscribe();
      }),
      map(() => true),
      catchError(error => {
        console.error('Login error', error);
        return of(false);
      })
    );
  }

  /**
   * Register a new user
   */
  signup(userData: UserSignupForm): Observable<boolean> {
    return this.http.post<ApiResponse>('/api/auth/signup', userData).pipe(
      map(() => true),
      catchError(error => {
        console.error('Signup error', error);
        return of(false);
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): Observable<boolean> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
      }),
      map(() => true),
      catchError(() => {
        // Even if the API call fails, we still want to clear local state
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        return of(false);
      })
    );
  }

  /**
   * Request password reset email
   */
  requestPasswordReset(form: RequestPasswordForm): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/password/request-password-reset', form);
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, form: PasswordResetForm): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`/api/password/reset-password?token=${token}`, form);
  }

  /**
   * Change password (for authenticated users)
   */
  changePassword(form: ChangePasswordForm): Observable<ApiResponse> {
    return this.http.put<ApiResponse>('/api/password/change-password', form);
  }

  /**
   * Request email change
   */
  requestEmailChange(form: ChangeEmailForm): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/auth/change-email-request', form);
  }

  /**
   * Cancel email change
   */
  cancelEmailChange(token: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`/api/auth/cancel-email-change?token=${token}`, {});
  }

  /**
   * Verify email change
   */
  verifyEmailChange(token: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`/api/auth/change-email-verification?token=${token}`, {});
  }

  /**
   * Confirm email change
   */
  confirmEmailChange(token: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`/api/auth/change-email-confirmation?token=${token}`, {});
  }

  /**
   * Check if we have a valid token
   * Note: This is a simple check. For a real app, you might want to validate the token expiration
   */
  private hasValidToken(): boolean {
    // With the current implementation using cookies, we rely on the browser/server to handle token validity
    // This function could be expanded in the future if using localStorage/sessionStorage
    return document.cookie.includes('access_token');
  }
}
