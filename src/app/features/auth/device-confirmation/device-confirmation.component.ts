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
      this.confirmDevice();
    }
  }

  confirmDevice(): void {
    if (!this.token) return;

    this.deviceService.confirmDevice(this.token).subscribe({
      next: (response) => {
        // Obtenez l'ID de l'appareil depuis la réponse (si disponible)
        const deviceId = response?.['deviceId']; // Assurez-vous que votre API renvoie l'ID

        console.log("device confirmed: ", deviceId)
        // Mettre à jour le statut de confirmation avec l'ID
        this.authService.updateDeviceConfirmation(true, deviceId);

        this.isProcessing = false;
        this.displaySuccess(
          'Appareil confirmé avec succès ! Vous pouvez maintenant utiliser votre compte en toute sécurité.',
          'Continuer vers mon profil',
          null
        );
        this.buttonAction = () => {
          this.router.navigate(['/profile'])
        };
      },
      error: (error: HttpErrorResponse) => {
        const alternateMessage: string = 'Une erreur est survenue lors de la confirmation de l\'appareil.';
        this.handleError(error, alternateMessage );
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
          'Aller à mon profil',
          null
        );
        this.buttonAction = () => {
          this.router.navigate(['/profile'])
        };
      },
      error: (error: HttpErrorResponse) => {
        const alternateMessage: string = "Une erreur est survenue lors du rejet de l\\'appareil.";
        this.handleError(error, alternateMessage );
      }
    });
  }

  private handleError(error: HttpErrorResponse, alternateMessage: string ) {
    this.isProcessing = false;
    console.log("rejecterror :", error);
    const errorMessage = error.error.error || alternateMessage;
    this.displayError(errorMessage, 'Retour à l\'accueil');
    this.buttonAction = () => this.router.navigate(['/']);
  }
}
