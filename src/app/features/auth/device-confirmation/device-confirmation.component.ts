import {Component, inject, OnInit} from '@angular/core';
import {FeedbackBase} from '../../../shared/feedback/tools/feedback.base';
import {ActivatedRoute, Router} from '@angular/router';
import {DeviceService} from '../../../data/services/device-service.service';
import {AuthService} from '../../../core/auth/services/auth.service';
import {HttpErrorResponse} from '@angular/common/http';
import {FeedbackComponent} from '../../../shared/feedback/feedback.component';

@Component({
  selector: 'app-device-confirmation',
  standalone: true,
  imports: [
    FeedbackComponent
  ],
  templateUrl: './device-confirmation.component.html',
  styleUrl: './device-confirmation.component.scss'
})
export class ConfirmDeviceComponent extends FeedbackBase implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deviceService = inject(DeviceService);
  private authService = inject(AuthService);

  isProcessing = false;
  token: string | null = null;
  action: 'confirm' | 'reject' | null = null;

  ngOnInit(): void {
    // Extraire le token de l'URL
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
      // Par défaut, confirmer l'appareil
      this.confirmDevice();
    }
  }

  confirmDevice(): void {
    if (!this.token) return;

    this.deviceService.confirmDevice(this.token).subscribe({
      next: () => {
        this.isProcessing = false;
        this.displaySuccess(
          'Appareil confirmé avec succès ! Vous pouvez maintenant utiliser votre compte en toute sécurité.',
          'Continuer vers l\'application',
          null
        );
        this.buttonAction = () => {
          // Si l'utilisateur est déjà connecté, aller au tableau de bord
          // Sinon, aller à la page de connexion
          if (this.authService.isAuthenticated()) {
            this.router.navigate(['/']);
          } else {
            this.router.navigate(['/auth/login']);
          }
        };
      },
      error: (error: HttpErrorResponse) => {
        this.isProcessing = false;
        console.log("rejecterror :", error);

        /*
        const errorMessage = error.error?.error || 'Une erreur est survenue lors de la confirmation de l\'appareil.';
        this.displayError(errorMessage, 'Retour à l\'accueil');
        this.buttonAction = () => this.router.navigate(['/']);

         */
      }
    });
  }

  rejectDevice(): void {
    if (!this.token) return;

    this.deviceService.rejectDevice(this.token).subscribe({
      next: () => {
        this.isProcessing = false;
        this.displayWarning(
          'Vous avez rejeté cet appareil. Si vous n\'avez pas tenté de vous connecter, votre compte est sécurisé.',
          'Retour à l\'accueil',
          null
        );
        this.buttonAction = () => this.router.navigate(['/']);
      },
      error: (error: HttpErrorResponse) => {
        this.isProcessing = false;
        console.log("rejecterror :", error);
        /*
        const errorMessage = error.error?.error || 'Une erreur est survenue lors du rejet de l\'appareil.';
        this.displayError(errorMessage, 'Retour à l\'accueil');
        this.buttonAction = () => this.router.navigate(['/']);

         */
      }
    });
  }
}
