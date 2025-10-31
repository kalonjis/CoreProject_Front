import {computed, inject, Injectable, OnDestroy, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NavigationEnd, Router} from '@angular/router';
import {catchError, filter, Observable, of, tap, throwError} from 'rxjs';
import {UserSignupForm} from '../../../data/models/auth/user-signup-form';
import {HttpUtilService} from '../../http/http-util.service';
import {User} from '../../../data/models/user/user';
import {Device} from '../../../data/models/device/device';
import {DeviceService} from '../../../data/services/device-service';
import {DeviceTrustLevel} from '../../../data/models/device/device-trust-level';
import {AuthState} from '../../../data/models/auth/auth.state';


@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {

  private http = inject(HttpClient);
  private router = inject(Router);
  private httpUtil = inject(HttpUtilService);
  private deviceService: DeviceService = inject(DeviceService);
  private deviceCheckInterval: any;
  private _confirmedDeviceId = signal<number | null>(null);

  // État d'authentification avec signals
  private _state = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isInitialized: false,
    isLoading: false,
    error: null,
    currentDevice: null
  });

  // Signaux dérivés (computed) pour lecture rapide
  public readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  public readonly isInitialized = computed(() => this._state().isInitialized);
  public readonly isLoading = computed(() => this._state().isLoading);
  public readonly user = computed(() => this._state().user);
  public readonly error = computed(() => this._state().error);
  public readonly username = computed(() => this._state().user?.username || null);
  public readonly isDeviceConfirmed = computed(() => this._state().currentDevice?.confirmed || false);
  public readonly confirmedDeviceId = this._confirmedDeviceId.asReadonly();


  // Pour accéder à l'état complet
  public readonly state = this._state.asReadonly();

  constructor() {
    // Écouter les événements de navigation pour détecter les changements importants
    // qui pourraient nécessiter une vérification de l'appareil (ex: login/logout)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Ne vérifier que lors de navigations importantes
      if (event.url.includes('/auth/login') || event.url.includes('/auth/logout')) {
        // Ces routes sont déjà gérées par leurs propres méthodes
        return;
      }

      // Pour les autres routes, vérifier seulement si l'état est ambigu
      if (this.isAuthenticated() && this._state().currentDevice === null) {
        this.getDeviceStatus();
      }
    });
  }


  private getDeviceStatus(): void {
    // Si nous avons un ID d'appareil confirmé, utiliser cette méthode optimisée
    const deviceId = this._confirmedDeviceId();

    if (deviceId) {
      this.deviceService.getDevice(deviceId).subscribe({
        next: (device) => {
          this._state.update(state => ({
            ...state,
            currentDevice: device
          }));
        },
        error: () => {
          // Fallback en cas d'erreur avec l'ID stocké
          this.loadCurrentDevice();
        }
      });
    } else {
      // Si nous n'avons pas d'ID confirmé, charger l'appareil courant
      this.loadCurrentDevice();
    }
  }


  // Méthode pour gérer le nettoyage des ressources
  ngOnDestroy(): void {
    if (this.deviceCheckInterval) {
      clearInterval(this.deviceCheckInterval);
    }
  }

  // Connexion utilisateur
  login(credentials: { username: string; password: string }): Observable<any> {
    this._state.update(state => ({...state, isLoading: true, error: null}));

    return this.http.post<any>('/api/auth/login', credentials, { withCredentials: true })
      .pipe(
        tap((response) => {
          // Si la réponse contient des informations sur l'appareil, les stocker
          if (response && response.deviceId) {
            const deviceId = response.deviceId;
            const deviceConfirmed = response.deviceConfirmed || false;

            // Stocker l'ID de l'appareil
            this._confirmedDeviceId.set(deviceId);
            localStorage.setItem('device_id', deviceId.toString());

            // Si l'appareil est confirmé, marquer comme tel
            if (deviceConfirmed) {
              localStorage.setItem('confirmed_device_id', deviceId.toString());

              // Précharger l'état de l'appareil
              this._state.update(state => ({
                ...state,
                currentDevice: this.createDefaultDevice(deviceId, deviceConfirmed)
              }));
            }
          }

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


  // Fonction utilitaire pour créer un objet Device par défaut
  private createDefaultDevice(id?: number, confirmed?: boolean): Device {
    return {
      id: id || 0,
      confirmed: confirmed || false,
      deviceType: 'Unknown',
      browser: 'Unknown',
      browserVersion: '',
      operatingSystem: '',
      osVersion: '',
      device_cpu: '',
      device_cpu_bits: '',
      language: '',
      deviceClass: '',
      deviceBrand: '',
      fingerprint: '',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      lastIpAddress: '',
      level: DeviceTrustLevel.BASIC,
      blacklisted: false,
      loggedOut: false,
      logoutTime: ''
    };
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
            this.router.navigate(['auth/change-password'], {
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
          this.clearSession();

          // Arrêter le check périodique (cette partie n'est pas dans clearSession)
          if (this.deviceCheckInterval) {
            clearInterval(this.deviceCheckInterval);
          }

          this.router.navigate(['/auth/login']);
        }),
        catchError(err => {
          this.clearSession();

          // Arrêter le check périodique
          if (this.deviceCheckInterval) {
            clearInterval(this.deviceCheckInterval);
          }

          this.router.navigate(['/auth/login']);
          return of(void 0);
        })
      );
  }

  // Vérifier l'état d'authentification au démarrage
  initialize(): Promise<void> {
    // Essayer de restaurer depuis localStorage
    const storedUser = localStorage.getItem('user');

    // Récupérer l'ID de l'appareil confirmé
    const confirmedDeviceId = localStorage.getItem('confirmed_device_id');
    if (confirmedDeviceId) {
      this._confirmedDeviceId.set(parseInt(confirmedDeviceId, 10));
    }

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
        next: () => {
          // Si authentifié, charger aussi les infos de l'appareil
          if (this.isAuthenticated()) {
            this.loadCurrentDevice();

            this.setupDeviceChecking(10 * 60 * 1000);
          }
          resolve();
        },
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


  private setupDeviceChecking(interval: number = 5 * 60 * 1000): void {
    // Nettoyer l'intervalle existant
    if (this.deviceCheckInterval) {
      clearInterval(this.deviceCheckInterval);
    }

    // Créer un intervalle moins fréquent maintenant que nous avons l'état initial correct
    this.deviceCheckInterval = setInterval(() => {
      if (this.isAuthenticated()) {
        // Si nous avons un ID confirmé, pas besoin de check périodique
        if (!this._confirmedDeviceId()) {
          this.refreshDeviceStatus();
        }
      } else {
        // Arrêter de vérifier si l'utilisateur n'est plus authentifié
        clearInterval(this.deviceCheckInterval);
      }
    }, interval);
  }


  refreshDeviceStatus(): void {
    if (!this.isAuthenticated()) return;

    this.getDeviceStatus();
  }


  // Méthode pour charger les infos de l'appareil courant
  loadCurrentDevice(): void {
    // Pas besoin de vérifier le localStorage si nous avons déjà l'ID dans le signal
    const deviceId = this._confirmedDeviceId();

    if (deviceId) {
      this.deviceService.getDevice(deviceId).subscribe({
        next: (device) => {
          this._state.update(state => ({
            ...state,
            currentDevice: device
          }));
        },
        error: () => {
          // En cas d'erreur, revenir à la méthode standard
          this.fetchCurrentDevice();
        }
      });
    } else {
      // Si pas d'ID confirmé, utiliser la méthode standard
      this.fetchCurrentDevice();
    }
  }


  private fetchCurrentDevice(): void {
    this.http.get<Device>('/api/device/current', { withCredentials: true })
      .subscribe({
        next: (device) => {
          this._state.update(state => ({
            ...state,
            currentDevice: device
          }));

          // Si l'appareil est confirmé, mettre à jour l'ID confirmé
          if (device.confirmed && device.id) {
            this._confirmedDeviceId.set(device.id);
            localStorage.setItem('confirmed_device_id', device.id.toString());
          }
        },
        error: (err) => {
          console.error('Failed to load device info', err);
        }
      });
  }


  // Méthode pour mettre à jour l'état de confirmation de l'appareil
  updateDeviceConfirmation(confirmed: boolean, deviceId?: number): void {
    if (confirmed && deviceId) {
      this._confirmedDeviceId.set(deviceId);
      localStorage.setItem('confirmed_device_id', deviceId.toString());
    }

    this._state.update(state => ({
      ...state,
      currentDevice: state.currentDevice
        ? { ...state.currentDevice, confirmed }
        : null
    }));
  }


  // Vérification des rôles
  hasRole(role: string): boolean {
    return this._state().user?.userRoles?.includes(role as any) || false;
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
    this.clearDeviceStorage();
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
    return this.http.post<any>('/api/account/signup', userData)
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


  // Méthode pour confirmer un compte
  confirmAccount(token: string): Observable<any> {
    return this.http.get<any>(`/api/account/activate?token=${token}`);
  }

  // Méthode pour demander un nouveau token de confirmation
  requestNewConfirmationToken(token: string): Observable<any> {
    return this.http.get<any>(`/api/account/resend-activation?token=${token}`);
  }


  /**
   * Demande un nouveau lien d'activation pour un compte non activé par son nom d'utilisateur
   * @param username Le nom d'utilisateur pour lequel demander une activation
   * @returns Observable de la réponse de l'API
   */
  requestNewActivationByUsername(username: string): Observable<any> {
    return this.http.get<any>(
      `/api/account-confirmation/request-confirmation-by-username?username=${encodeURIComponent(username)}`
    );
  }


  /**
   * Méthode pour demander la réinitialisation du mot de passe
   * @param email Adresse email pour laquelle réinitialiser le mot de passe
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.httpUtil.post<any>('/api/password/forgot', { email }, true);
  }


  requestNewPasswordToken(token: string): Observable<any> {
    return this.http.get<any>(`/api/password/reset/resend?token=${token}`);
  }

  /**
   * Méthode pour réinitialiser le mot de passe avec un token
   * @param token Token de réinitialisation
   * @param password Nouveau mot de passe
   * @param confirmPassword Confirmation du nouveau mot de passe
   */
  resetPassword(token: string, password: string, confirmPassword: string): Observable<any> {
    return this.httpUtil.put<any>(`/api/password/reset?token=${token}`, {
      password,
      confirmPassword
    }, true);
  }


  /**
   * Change le mot de passe de l'utilisateur connecté
   * @param data Objet contenant mot de passe actuel, nouveau mot de passe et confirmation
   * @returns Observable de la réponse de l'API
   */
  changePassword(data: {
    currentPassword: string;
    password: string;
    confirmPassword: string;
  }): Observable<any> {
    return this.http.put('/api/password/change', data, {
      withCredentials: true
    }).pipe(
      tap(() => {
        // Mettre à jour l'état après un changement de mot de passe réussi
        this._state.update(state => ({
          ...state,
          error: null
        }));
      }),
      catchError(err => {
        // Mettre à jour l'état en cas d'erreur
        this._state.update(state => ({
          ...state,
          error: this.extractErrorMessage(err)
        }));

        // Propager l'erreur
        return throwError(() => err);
      })
    );
  }

  /**
   * Vérifie si l'utilisateur doit changer son mot de passe (suite à une réinitialisation par un admin)
   * @returns boolean indiquant si l'utilisateur doit changer son mot de passe
   */
  mustChangePassword(): boolean {
    return this._state().user?.mustChangePassword || false;
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


  private clearDeviceStorage(): void{
    localStorage.removeItem('device_id');
    localStorage.removeItem('confirmed_device_id');
    this._confirmedDeviceId.set(null)
  }


  /**
   * Demande un changement d'adresse email
   */
  changeEmailRequest(email: string, confirmEmail: string): Observable<any> {
    return this.http.post('/api/email-address-change/request', {
      email,
      confirmEmail
    }, { withCredentials: true });
  }

  /**
   * Confirme la première étape du changement d'email (vérification de l'ancien email)
   */
  verifyEmailChange(token: string): Observable<any> {
    return this.http.get(`/api/email-address-change/verification?token=${token}`);
  }

  /**
   * Finalise le changement d'email après confirmation de la nouvelle adresse
   */
  confirmEmailChange(token: string): Observable<any> {
    return this.http.get(`/api/email-address-change/confirmation?token=${token}`);
  }

  /**
   * Annule le processus de changement d'email
   */
  cancelEmailChange(token: string): Observable<any> {
    return this.http.get(`/api/email-address-change/cancel?token=${token}`);
  }
}
