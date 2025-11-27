import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';

// Migrated imports
import { AuthFacade } from '../../../core/auth';
import { DeviceApiService } from '../../../core/device';

@Component({
  selector: 'app-device-confirmation',
  standalone: true,
  imports: [FeedbackComponent],
  templateUrl: './device-confirmation.component.html',
  styleUrl: './device-confirmation.component.scss'
})
export class ConfirmDeviceComponent extends FeedbackBase implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly deviceApi = inject(DeviceApiService);
  private readonly auth = inject(AuthFacade);

  isProcessing = false;
  token: string | null = null;
  action: 'confirm' | 'reject' | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      this.action = params.get('action') as 'confirm' | 'reject' | null;

      if (this.token) {
        this.processToken();
      } else {
        this.displayError('Aucun token de confirmation trouvé dans l\'URL', 'Retour à l\'accueil');
        this.buttonAction = () => this.router.navigate(['/']);
      }
    });
  }

  processToken(): void {
    this.isProcessing = true;

    if (this.action === 'reject') {
      this.rejectDevice();
    } else {
      this.confirmDevice();
    }
  }

  confirmDevice(): void {
    if (!this.token) return;

    this.deviceApi.confirmDevice(this.token).subscribe({
      next: (response) => {
        console.log('[DeviceConfirmation] Device confirmed:', response);

        // ✅ NOUVEAU: Refresh le DeviceStore pour mettre à jour isDeviceConfirmed
        // Ceci va automatiquement cacher la bannière d'alerte
        if (this.auth.isAuthenticated()) {
          this.auth.reloadDeviceSession().subscribe({
            next: () => {
              console.log('[DeviceConfirmation] DeviceStore updated');
            },
            error: (err) => {
              console.warn('[DeviceConfirmation] Failed to refresh device store', err);
            }
          });
        }

        this.isProcessing = false;
        this.displaySuccess(
          'Appareil confirmé avec succès ! Vous pouvez maintenant utiliser votre compte en toute sécurité.',
          'Continuer vers mon profil',
          null
        );
        this.buttonAction = () => this.router.navigate(['/profile']);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Une erreur est survenue lors de la confirmation de l\'appareil.');
      }
    });
  }

  rejectDevice(): void {
    if (!this.token) return;

    this.deviceApi.rejectDevice(this.token).subscribe({
      next: () => {
        this.isProcessing = false;
        this.displayWarning(
          'Vous avez rejeté cet appareil. Si vous n\'avez pas tenté de vous connecter, votre compte est sécurisé.',
          'Aller à mon profil',
          null
        );
        this.buttonAction = () => this.router.navigate(['/profile']);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Une erreur est survenue lors du rejet de l\'appareil.');
      }
    });
  }

  private handleError(error: HttpErrorResponse, alternateMessage: string): void {
    this.isProcessing = false;
    console.error('[DeviceConfirmation] Error:', error);
    const errorMessage = error.error?.error || alternateMessage;
    this.displayError(errorMessage, 'Retour à l\'accueil');
    this.buttonAction = () => this.router.navigate(['/']);
  }
}
