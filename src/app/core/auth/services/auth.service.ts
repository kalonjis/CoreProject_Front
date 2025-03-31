// auth.service.ts
import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {Observable, catchError, map, of, tap, throwError} from 'rxjs';
import {UserSignupForm} from '../../../data/models/auth/user-signup-form';

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  mustChangePassword: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // État d'authentification avec signals
  private _state = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isInitialized: false,
    isLoading: false,
    error: null
  });

  // Signaux dérivés (computed) pour lecture rapide
  public readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  public readonly isInitialized = computed(() => this._state().isInitialized);
  public readonly isLoading = computed(() => this._state().isLoading);
  public readonly user = computed(() => this._state().user);
  public readonly error = computed(() => this._state().error);
  public readonly username = computed(() => this._state().user?.username || null);

  // Pour accéder à l'état complet
  public readonly state = this._state.asReadonly();

  // Connexion utilisateur
  login(credentials: { username: string; password: string }): Observable<void> {
    this._state.update(state => ({...state, isLoading: true, error: null}));

    return this.http.post<void>('/api/auth/login', credentials, { withCredentials: true })
      .pipe(
        tap(() => {
          // Après connexion réussie, charger le profil
          this.loadUserProfile().subscribe();
        }),
        catchError(err => {
          const errorMsg = err.error?.message || 'Échec de connexion';
          this._state.update(state => ({...state, isLoading: false, error: errorMsg}));
          throw err;
        })
      );
  }

  // Chargement du profil utilisateur
  loadUserProfile(): Observable<User> {
    return this.http.get<User>('/api/auth/me', { withCredentials: true })
      .pipe(
        tap(user => {
          this._state.update(state => ({
            ...state,
            user,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null
          }));

          // Enregistrer dans localStorage pour UX
          this.saveUserToStorage(user);

          // Rediriger si changement de mot de passe requis
          if (user.mustChangePassword) {
            this.router.navigate(['/change-password'], {
              queryParams: { forced: 'true' }
            });
          }
        }),
        catchError(err => {
          this._state.update(state => ({
            ...state,
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: 'Session expirée ou non authentifiée'
          }));
          this.clearUserStorage();
          throw err;
        })
      );
  }

  // Déconnexion
  logout(): Observable<void> {
    this._state.update(state => ({...state, isLoading: true}));

    return this.http.post<void>('/api/auth/logout', {}, { withCredentials: true })
      .pipe(
        tap(() => {
          // Nettoyage côté client
          this._state.update(state => ({
            ...state,
            user: null,
            isAuthenticated: false,
            isLoading: false
          }));

          this.clearUserStorage();
          this.router.navigate(['/auth/login']);
        }),
        catchError(err => {
          // Même en cas d'erreur, nettoyage local
          this._state.update(state => ({
            ...state,
            user: null,
            isAuthenticated: false,
            isLoading: false
          }));

          this.clearUserStorage();
          this.router.navigate(['/login']);
          return of(void 0);
        })
      );
  }

  // Vérifier l'état d'authentification au démarrage
  initialize(): Promise<void> {
    // Essayer de restaurer depuis localStorage
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        this._state.update(state => ({
          ...state,
          isLoading: true,
          // Utilisation provisoire des données stockées
          user: userData,
          isAuthenticated: true
        }));
      } catch (e) {
        this.clearUserStorage();
      }
    }

    // Toujours vérifier avec le serveur
    return new Promise<void>((resolve) => {
      this.loadUserProfile().subscribe({
        next: () => resolve(),
        error: () => {
          this._state.update(state => ({
            ...state,
            isInitialized: true
          }));
          resolve();
        }
      });
    });
  }

  // Stockage local des infos non sensibles
  private saveUserToStorage(user: User): void {
    // N'enregistrez PAS le token ou d'autres infos sensibles
    localStorage.setItem('user', JSON.stringify({
      id: user.id,
      username: user.username,
      lastLogin: new Date().toISOString(),
      // Préférences UI
      theme: localStorage.getItem('theme') || 'light',
      language: localStorage.getItem('language') || 'fr'
    }));
  }

  // Nettoyage du stockage
  private clearUserStorage(): void {
    localStorage.removeItem('user');
  }

  // Vérification des rôles
  hasRole(role: string): boolean {
    return this._state().user?.roles?.includes(role) || false;
  }

  /**
   * Efface les données de session côté client sans faire d'appel API
   * Utile en cas d'erreur d'authentification ou de refresh token échoué
   */
  clearSession(): void {
    // Mettre à jour l'état d'authentification
    this._state.update(state => ({
      ...state,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    }));

    // Supprimer les données locales
    this.clearUserStorage();
  }


  // À ajouter à votre AuthService

  /**
   * Rafraîchit le token d'accès à l'aide du refresh token
   * @returns Un observable qui émet quand le token est rafraîchi
   */
  refreshToken(): Observable<any> {
    this._state.update(state => ({...state, isLoading: true}));

    return this.http.post<void>('/api/auth/refresh-token', {}, { withCredentials: true })
      .pipe(
        tap(() => {
          // Marquer l'authentification comme réussie
          this._state.update(state => ({
            ...state,
            isAuthenticated: true,
            isLoading: false,
            error: null
          }));
        }),
        catchError(err => {
          this._state.update(state => ({
            ...state,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: 'Failed to refresh session'
          }));

          // Nettoyer le stockage local
          this.clearUserStorage();

          // Propager l'erreur pour que l'intercepteur puisse la gérer
          return throwError(() => err);
        })
      );
  }


  /**
   * Inscription d'un nouvel utilisateur
   * @param userData Les données d'inscription de l'utilisateur
   * @returns Observable indiquant que l'inscription a réussi
   */
  signup(userData: UserSignupForm): Observable<any> {
    // Mettre à jour l'état pour indiquer le chargement
    this._state.update(state => ({...state, isLoading: true, error: null}));

    // Faire la requête POST vers l'API d'inscription
    return this.http.post<any>('/api/auth/signup', userData)
      .pipe(
        tap(response => {
          // Mettre à jour l'état après une inscription réussie
          this._state.update(state => ({...state, isLoading: false}));

          // Log de confirmation (optionnel, pour debug)
          console.log('Inscription réussie', response);
        }),
        catchError(err => {
          // Mettre à jour l'état en cas d'erreur d'inscription
          this._state.update(state => ({
            ...state,
            isLoading: false,
            error: this.extractErrorMessage(err)
          }));

          // Log d'erreur (optionnel, pour debug)
          console.error('Erreur d\'inscription:', err);

          // Propager l'erreur pour que le composant puisse la gérer
          return throwError(() => err);
        })
      );
  }

  /**
   * Extrait un message d'erreur lisible à partir d'une réponse d'erreur HTTP
   * @param err L'erreur HTTP
   * @returns Un message d'erreur formaté
   */
  private extractErrorMessage(err: any): string {
    if (err.error?.message) {
      return err.error.message;
    } else if (err.error?.errors && Array.isArray(err.error.errors)) {
      return err.error.errors.join('\n');
    } else if (err.error?.globalErrors && Array.isArray(err.error.globalErrors)) {
      return err.error.globalErrors.join('\n');
    } else if (err.status === 0) {
      return 'Le serveur est inaccessible. Veuillez vérifier votre connexion internet.';
    } else if (err.status === 500) {
      return 'Une erreur interne est survenue. Veuillez réessayer plus tard.';
    } else {
      return 'Échec de l\'inscription. Veuillez réessayer.';
    }
  }
}
