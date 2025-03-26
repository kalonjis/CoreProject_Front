import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { User } from '../../../data/models/user/user';
import { LoginForm } from '../../../data/models/auth/login-form';
import { UserSignupForm } from '../../../data/models/user/user-signup-form';
import { jwtDecode } from 'jwt-decode';
import { CookieService } from './cookie.service';
import { UserRole } from '../../../data/models/user/user-role';

interface JwtPayload {
  username: string;
  roles: string[];
  deviceId: number;
  deviceTrustLevel: string;
  exp: number;
  sub: string;
  [key: string]: any;
}

export interface SessionState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  lastRefreshed: number | null;
  tokenExpiry: number | null;
  deviceId: number | null;
  deviceTrustLevel: string | null;
}

/**
 * Service global de gestion de session utilisateur
 * Responsable de l'initialisation de la session, de l'authentification,
 * et de la gestion du state d'authentification global
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cookieService = inject(CookieService);

  // État privé de la session
  private _state = signal<SessionState>({
    user: null,
    isAuthenticated: false,
    isInitialized: false,
    isLoading: true,
    error: null,
    lastRefreshed: null,
    tokenExpiry: null,
    deviceId: null,
    deviceTrustLevel: null
  });

  // Signaux publics calculés à partir de l'état
  public readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  public readonly isInitialized = computed(() => this._state().isInitialized);
  public readonly isLoading = computed(() => this._state().isLoading);
  public readonly user = computed(() => this._state().user);
  public readonly error = computed(() => this._state().error);
  public readonly username = computed(() => this._state().user?.username || null);
  public readonly deviceTrustLevel = computed(() => this._state().deviceTrustLevel);
  public readonly deviceId = computed(() => this._state().deviceId);
  public readonly tokenExpiry = computed(() => this._state().tokenExpiry);

  public readonly isAdmin = computed(() => {
    const roles = this._state().user?.userRoles || [];
    return roles.includes(UserRole.ADMIN) || roles.includes(UserRole.SUPER_ADMIN);
  });

  public readonly isModerator = computed(() => {
    const roles = this._state().user?.userRoles || [];
    return roles.includes(UserRole.MODERATOR) || this.isAdmin();
  });

  // Pour un accès complet à l'état si nécessaire
  public readonly state = this._state.asReadonly();

  /**
   * Vérifie l'état de l'authentification en faisant une requête API
   * Cette méthode est plus fiable que la vérification des cookies
   * car elle fonctionne même avec des cookies HTTPOnly
   */
  public checkAuthStatus(): Promise<boolean> {
    console.log("[SessionService] Vérification de l'état d'authentification via API");

    // Marquer comme en cours de chargement
    this.updateState({ isLoading: true });

    return new Promise<boolean>((resolve) => {
      this.http.get<{isAuthenticated: boolean}>('/api/auth/status').subscribe({
        next: (response) => {
          console.log("[SessionService] Réponse du statut d'authentification:", response.isAuthenticated);
          this.updateState({ isLoading: false });

          if (response.isAuthenticated) {
            // Si authentifié, charger le profil utilisateur
            this.loadUserProfile().then(() => {
              resolve(true);
            });
          } else {
            // Sinon, mettre à jour l'état
            this.updateState({
              isAuthenticated: false,
              isInitialized: true,
              user: null
            });
            resolve(false);
          }
        },
        error: (error) => {
          console.error("[SessionService] Erreur lors de la vérification de l'authentification:", error);
          this.updateState({
            isLoading: false,
            isAuthenticated: false,
            isInitialized: true,
            user: null
          });
          resolve(false);
        }
      });
    });
  }



  /**
   * Initialise la session utilisateur au démarrage de l'application
   */
  public initialize(): Promise<void> {
    console.log("[SessionService] Initialisation de la session");

    return new Promise<void>((resolve) => {
      // Tentons de restaurer l'état depuis localStorage (pour une meilleure UX)
      const restoredFromStorage = this.restoreAuthStateFromStorage();

      // Peu importe, on vérifie toujours avec le serveur
      this.checkAuthStatus().then(() => {
        console.log("[SessionService] Initialisation terminée, état:",
          this.isAuthenticated() ? "authentifié" : "non authentifié");
        resolve();
      });
    });
  }

  /**
   * Charge le profil utilisateur depuis l'API
   */
  public loadUserProfile(): Promise<void> {
    this.updateState({ isLoading: true });

    return new Promise<void>((resolve) => {
      this.http.get<User>('/api/auth/me').pipe(
        tap(user => {
          this.updateState({
            user,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null,
            lastRefreshed: Date.now()
          });
          this.saveAuthStateToStorage(user, true);
        }),
        catchError(error => {
          console.error('Erreur lors du chargement du profil', error);
          this.updateState({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: 'Session expirée ou invalide'
          });
          return of(undefined);
        })
      ).subscribe({
        next: () => resolve(),
        error: () => resolve()
      });
    });
  }

  /**
   * Connecte l'utilisateur et met à jour l'état global
   */
  public login(credentials: LoginForm): Observable<void> {
    this.updateState({
      isLoading: true,
      error: null
    });

    return this.http.post<void>('/api/auth/login', credentials).pipe(
      tap(() => {
        // Essayer de récupérer les informations du token après login
        try {
          const tokenInfo = this.getTokenInfo();
          if (tokenInfo) {
            this.updateState({
              tokenExpiry: tokenInfo.exp * 1000,
              deviceId: tokenInfo.deviceId,
              deviceTrustLevel: tokenInfo.deviceTrustLevel
            });
          }
        } catch (error) {
          console.warn('Erreur lors du décodage du token', error);
        }

        // Charger le profil utilisateur
        this.loadUserProfile().then((user) => {

          // Redirection après login réussi
          const returnUrl = this.getReturnUrl();
          this.router.navigateByUrl(returnUrl);
        });
      }),
      catchError(error => {
        this.updateState({
          isLoading: false,
          error: error.error?.error || 'Erreur lors de la connexion'
        });
        throw error;
      })

    );
  }

  /**
   * Déconnecte l'utilisateur et nettoie l'état global
   */
  public logout(): Observable<void> {
    this.updateState({ isLoading: true });

    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => {
        this.clearSession();
        this.saveAuthStateToStorage(null, false);
        this.router.navigate(['/auth/login']);
      }),
      catchError(error => {
        // Même en cas d'erreur, on nettoie la session côté client
        console.error('Erreur lors de la déconnexion', error);
        this.clearSession();
        this.router.navigate(['/auth/login']);
        return of(void 0);
      })
    );
  }

  /**
   * Inscrit un nouvel utilisateur
   */
  public signup(userData: UserSignupForm): Observable<void> {
    this.updateState({
      isLoading: true,
      error: null
    });

    return this.http.post<void>('/api/auth/signup', userData).pipe(
      tap(() => {
        this.updateState({ isLoading: false });
        this.router.navigate(['/auth/login'], { queryParams: { registered: 'true' } });
      }),
      catchError(error => {
        this.updateState({
          isLoading: false,
          error: error.error?.error || 'Erreur lors de l\'inscription'
        });
        throw error;
      })
    );
  }

  /**
   * Rafraîchit le token d'accès si nécessaire
   */
  public refreshTokenIfNeeded(): Observable<boolean> {
    const tokenExpiry = this._state().tokenExpiry;

    // Si pas d'expiration ou si l'expiration est dans plus de 5 minutes
    if (!tokenExpiry || tokenExpiry > Date.now() + 5 * 60 * 1000) {
      return of(true);
    }

    return this.http.post<void>('/api/auth/refresh-token', {}).pipe(
      map(() => {
        // Mettre à jour les informations du token après rafraîchissement
        try {
          const tokenInfo = this.getTokenInfo();
          if (tokenInfo) {
            this.updateState({
              tokenExpiry: tokenInfo.exp * 1000,
              lastRefreshed: Date.now()
            });
          }
        } catch (error) {
          console.warn('Erreur lors du décodage du token après rafraîchissement', error);
        }
        return true;
      }),
      catchError(error => {
        console.error('Erreur lors du rafraîchissement du token', error);
        if (error.status === 401 || error.status === 403) {
          this.clearSession();
        }
        return of(false);
      })
    );
  }

  /**
   * Vérifie si l'utilisateur a un niveau de confiance suffisant pour l'appareil
   */
  public hasRequiredTrustLevel(requiredLevel: string): boolean {
    const deviceTrustLevel = this._state().deviceTrustLevel;

    if (!deviceTrustLevel) return false;

    // Mapping des niveaux de confiance pour comparaison
    const trustLevels: Record<string, number> = {
      'UNTRUSTED': 0,
      'BASIC': 1,
      'TRUSTED': 2,
      'HIGHLY_TRUSTED': 3
    };

    return (trustLevels[deviceTrustLevel] ?? 0) >= (trustLevels[requiredLevel] ?? 0);
  }

  /**
   * Vérifie si l'utilisateur possède un rôle spécifique
   */
  public hasRole(role: UserRole): boolean {
    const user = this._state().user;
    if (!user) return false;

    return user.userRoles.includes(role);
  }

  // Méthodes privées

  /**
   * Met à jour l'état de la session avec les nouvelles valeurs
   */
  private updateState(newState: Partial<SessionState>): void {
    this._state.update(state => ({
      ...state,
      ...newState
    }));
  }

  /**
   * Nettoie complètement l'état de la session
   */
  private clearSession(): void {
    this._state.set({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      error: null,
      lastRefreshed: null,
      tokenExpiry: null,
      deviceId: null,
      deviceTrustLevel: null
    });
  }

  /**
   * Récupère et décode le token JWT depuis les cookies
   */
  private getTokenInfo(): JwtPayload | null {
    const token = this.cookieService.getCookie('access_token');
    if (!token) return null;

    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Erreur de décodage du token JWT', error);
      return null;
    }
  }

  /**
   * Récupère l'URL de retour stockée ou la page d'accueil par défaut
   */
  private getReturnUrl(): string {
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      localStorage.removeItem('returnUrl');
      return returnUrl;
    }
    return '/';
  }

  /**
   * Sauvegarde l'état d'authentification dans localStorage
   * Cela permet de conserver l'état même si les cookies sont HTTPOnly
   */
  private saveAuthStateToStorage(user: User | null, isAuthenticated: boolean): void {
    if (isAuthenticated && user) {
      localStorage.setItem('auth_state', JSON.stringify({
        isAuthenticated: true,
        username: user.username,
        lastLogin: Date.now(),            // Timestamp
        hasSeenWelcomeMessage: true,      // Préférences UI non sensibles
        theme: 'dark',                    // Préférences UI
        language: 'fr'                    // Préférences UI

      }));
      console.log("État d'authentification sauvegardé dans localStorage");
    } else {
      localStorage.removeItem('auth_state');
      console.log("État d'authentification supprimé de localStorage");
    }
  }

  /**
   * Restaure l'état d'authentification depuis localStorage
   * Utile pour le chargement initial si les cookies sont HTTPOnly
   */
  private restoreAuthStateFromStorage(): boolean {
    const savedState = localStorage.getItem('auth_state');
    console.log("Tentative de restauration depuis localStorage:", savedState ? "données trouvées" : "aucune donnée");

    if (!savedState) return false;

    try {
      const parsedState = JSON.parse(savedState);
      const timestamp = parsedState.lastSaved || 0;
      const now = Date.now();
      const fourHoursAgo = now - (4 * 60 * 60 * 1000); // 4 heures

      // Si l'état sauvegardé est trop ancien, ne pas l'utiliser
      if (timestamp < fourHoursAgo) {
        console.log("État d'authentification trop ancien, ignoré");
        localStorage.removeItem('auth_state');
        return false;
      }

      console.log("État d'authentification restauré depuis localStorage");
      // On ne restaure qu'un état partiel - on vérifiera toujours avec l'API
      this.updateState({
        isAuthenticated: true,
        isLoading: true
      });

      return true;
    } catch (error) {
      console.error("Erreur lors de la restauration de l'état:", error);
      localStorage.removeItem('auth_state');
      return false;
    }
  }
}


