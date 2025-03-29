// auth.service.ts
import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';

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
          this.router.navigate(['/login']);
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
}
