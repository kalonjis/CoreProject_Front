import { inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import {User} from '../../../data/models/user/user';
import {LoginForm} from '../../../data/models/auth/login-form';
import {ApiResponse} from '../../../data/models/auth/api-response';
import {UserSignupForm} from '../../../data/models/user/user-signup-form';
import {RequestPasswordForm} from '../../../data/models/auth/request-password-form';
import {PasswordResetForm} from '../../../data/models/auth/password-reset-form';
import {ChangePasswordForm} from '../../../data/models/auth/change-password-form';
import {ChangeEmailForm} from '../../../data/models/auth/change-email-form';


// Service d'authentification fonctionnel
export function provideAuthService() {
  // Dépendances
  const http = inject(HttpClient);
  const router = inject(Router);

  // État avec signaux
  const currentUser = signal<User | null>(null);
  const isAuthenticated = signal<boolean>(hasValidToken());

  // Observables dérivés des signaux
  const currentUser$ = toObservable(currentUser);
  const isAuthenticated$ = toObservable(isAuthenticated);

  // Initialisation
  if (isAuthenticated()) {
    loadCurrentUser().subscribe();
  }

  // Vérifier si on a un token valide
  function hasValidToken(): boolean {
    return document.cookie.includes('access_token');
  }

  // Charger les données de l'utilisateur actuel
  function loadCurrentUser(): Observable<User | null> {
    return http.get<User>('/api/auth/me').pipe(
      tap(user => {
        currentUser.set(user);
        isAuthenticated.set(true);
      }),
      catchError(() => {
        logout();
        return of(null);
      })
    );
  }

  // Connexion utilisateur
  function login(credentials: LoginForm): Observable<boolean> {
    return http.post<ApiResponse>('/api/auth/login', credentials).pipe(
      tap(() => {
        isAuthenticated.set(true);
        loadCurrentUser().subscribe();
      }),
      map(() => true),
      catchError(error => {
        console.error('Login error', error);
        return of(false);
      })
    );
  }

  // Inscription utilisateur
  function signup(userData: UserSignupForm): Observable<boolean> {
    return http.post<ApiResponse>('/api/auth/signup', userData).pipe(
      map(() => true),
      catchError(error => {
        console.error('Signup error', error);
        return of(false);
      })
    );
  }

  // Déconnexion
  function logout(): Observable<boolean> {
    return http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => {
        currentUser.set(null);
        isAuthenticated.set(false);
        router.navigate(['/login']);
      }),
      map(() => true),
      catchError(() => {
        currentUser.set(null);
        isAuthenticated.set(false);
        return of(false);
      })
    );
  }

  // Demande de réinitialisation de mot de passe
  function requestPasswordReset(form: RequestPasswordForm): Observable<ApiResponse> {
    return http.post<ApiResponse>('/api/password/request-password-reset', form);
  }

  // Réinitialisation du mot de passe
  function resetPassword(token: string, form: PasswordResetForm): Observable<ApiResponse> {
    return http.put<ApiResponse>(`/api/password/reset-password?token=${token}`, form);
  }

  // Changement de mot de passe
  function changePassword(form: ChangePasswordForm): Observable<ApiResponse> {
    return http.put<ApiResponse>('/api/password/change-password', form);
  }

  // Demande de changement d'email
  function requestEmailChange(form: ChangeEmailForm): Observable<ApiResponse> {
    return http.post<ApiResponse>('/api/auth/change-email-request', form);
  }

  // Annulation de changement d'email
  function cancelEmailChange(token: string): Observable<ApiResponse> {
    return http.patch<ApiResponse>(`/api/auth/cancel-email-change?token=${token}`, {});
  }

  // Vérification de changement d'email
  function verifyEmailChange(token: string): Observable<ApiResponse> {
    return http.patch<ApiResponse>(`/api/auth/change-email-verification?token=${token}`, {});
  }

  // Confirmation de changement d'email
  function confirmEmailChange(token: string): Observable<ApiResponse> {
    return http.put<ApiResponse>(`/api/auth/change-email-confirmation?token=${token}`, {});
  }

  // API publique du service
  return {
    // Signaux et observables
    currentUser,
    isAuthenticated,
    currentUser$,
    isAuthenticated$,

    // Méthodes
    loadCurrentUser,
    login,
    signup,
    logout,
    requestPasswordReset,
    resetPassword,
    changePassword,
    requestEmailChange,
    cancelEmailChange,
    verifyEmailChange,
    confirmEmailChange
  };
}
