import { Component, inject, DestroyRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { DeviceService } from '../../data/services/device-service.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-device-alert-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './device-alert-banner.component.html',
  styleUrl: './device-alert-banner.component.scss'
})
export class DeviceAlertBannerComponent implements OnInit {
  private authService = inject(AuthService);
  private deviceService = inject(DeviceService);
  private destroyRef = inject(DestroyRef);

  // État local
  private bannerDismissed = signal(false);
  protected isRequestingLink = signal(false);

  // Intervalle de vérification périodique
  private checkInterval: any;

  ngOnInit(): void {
    // Vérifier périodiquement l'état de l'appareil (toutes les 5 minutes)
    this.checkInterval = setInterval(() => {
      this.refreshDeviceStatus();
    }, 5 * 60 * 1000); // 5 minutes

    // Vérifier au démarrage pour s'assurer d'avoir les dernières infos
    this.refreshDeviceStatus();
  }

  ngOnDestroy(): void {
    // Nettoyer l'intervalle à la destruction du composant
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Détermine si la bannière doit être affichée en fonction de l'état d'authentification,
   * de confirmation de l'appareil et de l'état de rejet de la bannière
   */
  showBanner(): boolean {
    return this.authService.isAuthenticated() &&
      !this.authService.isDeviceConfirmed() &&
      !this.bannerDismissed();
  }

  /**
   * Rafraîchit l'état de l'appareil auprès du serveur
   */
  refreshDeviceStatus(): void {
    if (!this.authService.isAuthenticated()) return;

    this.authService.refreshDeviceStatus();
  }

  /**
   * Demande un nouveau lien de confirmation pour l'appareil actuel
   */
  requestNewConfirmationLink(): void {
    if (this.isRequestingLink()) return;

    this.isRequestingLink.set(true);

    this.deviceService.requestDeviceConfirmationLink()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Notification de succès (pourrait utiliser un service de feedback global)
          alert('Un nouveau lien de confirmation a été envoyé à votre adresse email.');
          this.isRequestingLink.set(false);
        },
        error: (error: HttpErrorResponse) => {
          // Gestion des erreurs
          console.error('Erreur lors de la demande de nouveau lien', error);
          alert('Une erreur est survenue lors de la demande du lien de confirmation. Veuillez réessayer plus tard.');
          this.isRequestingLink.set(false);
        }
      });
  }

  /**
   * Rejette temporairement la bannière pour la session actuelle
   */
  dismissBanner(): void {
    this.bannerDismissed.set(true);

    // Optionnel : stocker la décision dans sessionStorage pour la conserver
    // pendant toute la session du navigateur
    sessionStorage.setItem('device-banner-dismissed', 'true');
  }
}
