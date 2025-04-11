import { Injectable, inject, signal, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {tap, catchError, of, timer, switchMap} from 'rxjs';
import {DeviceService} from '../../data/services/device-service.service';
import {FeedbackService} from '../../shared/feedback/tools/feedback.service';
import {AuthService} from '../auth/services/auth.service';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DeviceVerificationService {
  private deviceService = inject(DeviceService);
  private feedbackService = inject(FeedbackService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);

  // Signal indiquant si l'appareil actuel est vérifié
  private _deviceVerified = signal<boolean | null>(null);

  // ID de l'appareil actuel
  private _currentDeviceId = signal<number | null>(null);

  // Signal indiquant si la vérification est en cours
  private _verificationChecking = signal(false);

  // Signal pour lecture externe
  readonly isDeviceVerified = this._deviceVerified.asReadonly();
  readonly currentDeviceId = this._currentDeviceId.asReadonly();
  readonly isChecking = this._verificationChecking.asReadonly();

  constructor() {
    // Souscrire aux changements d'authentification en dehors d'un effet
      if (this.authService.isAuthenticated()) {
        this.checkCurrentDeviceStatus();
      } else {
        this._deviceVerified.set(null);
        this._currentDeviceId.set(null);
      }
  }

  /**
   * Vérifie le statut de l'appareil actuel
   * Définit deviceVerified à true si l'appareil est confirmé
   */
  checkCurrentDeviceStatus(): void {
    if (!this.authService.isAuthenticated()) return;

    this._verificationChecking.set(true);
    console.log('Vérification du statut de l\'appareil...');

    this.deviceService.getCurrentDevice()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(device => {
          console.log('Appareil détecté:', device);
          this._deviceVerified.set(device.confirmed);
          this._currentDeviceId.set(device.id);
          this._verificationChecking.set(false);
        }),
        catchError(err => {
          console.error('Erreur lors de la vérification du statut de l\'appareil', err);
          this._verificationChecking.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Renvoie l'email de confirmation pour l'appareil actuel
   * Montre un message de succès ou d'erreur
   */
  resendVerificationEmail(): void {
    if (!this._currentDeviceId()) {
      this.feedbackService.showError(
        "Impossible d'envoyer l'email de confirmation. Appareil non détecté.",
        "Fermer"
      );
      return;
    }

    this._verificationChecking.set(true);

    // Endpoint de renvoi d'email (à créer côté back-end)
    this.http.post<any>(`/api/device/resend-verification/${this._currentDeviceId()}`, {})
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.feedbackService.showSuccess(
            "Un nouvel email de confirmation a été envoyé. Veuillez vérifier votre boîte de réception.",
            "Fermer"
          );
          this._verificationChecking.set(false);
        }),
        catchError(err => {
          console.error('Erreur lors du renvoi de l\'email', err);
          this._verificationChecking.set(false);

          // Message d'erreur adapté selon le code d'erreur
          if (err.status === 429) {
            this.feedbackService.showWarning(
              "Trop de tentatives. Veuillez patienter avant de demander un nouvel email.",
              "Fermer"
            );
          } else {
            this.feedbackService.showError(
              "Impossible d'envoyer l'email de confirmation. Veuillez réessayer plus tard.",
              "Fermer"
            );
          }

          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Configure une vérification périodique du statut de l'appareil
   * Utile après qu'un utilisateur a confirmé son appareil via email
   */
  startPeriodicCheck(intervalMs: number = 30000): void {
    // Arrêter après 5 vérifications ou si l'appareil est confirmé
    let attempts = 0;
    const maxAttempts = 5;

    timer(10000, intervalMs)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          // Arrêter les vérifications si l'appareil est déjà confirmé
          if (this._deviceVerified() === true) return of(null);

          // Arrêter après le nombre maximum de tentatives
          if (attempts >= maxAttempts) return of(null);

          attempts++;
          return this.deviceService.getCurrentDevice();
        }),
        tap(device => {
          if (device) {
            this._deviceVerified.set(device.confirmed);
            this._currentDeviceId.set(device.id);
          }
        })
      )
      .subscribe();
  }
}
