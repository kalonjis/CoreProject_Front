import {Component, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FeedbackBase} from '../../../shared/feedback/tools/feedback.base';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {FeedbackComponent} from '../../../shared/feedback/feedback.component';
import {DeviceFacade} from '../../../core/device';

@Component({
    selector: 'app-device-confirmation',
    imports: [
        FeedbackComponent
    ],
    templateUrl: './device-confirmation.component.html',
    styleUrl: './device-confirmation.component.scss'
})
export class ConfirmDeviceComponent extends FeedbackBase implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deviceFacade = inject(DeviceFacade);
  private destroyRef = inject(DestroyRef);

  isProcessing = signal(false);
  token: string | null = null;
  action: 'confirm' | 'reject' | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      if (this.isProcessing()) return;

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
    this.isProcessing.set(true);

    if (this.action === 'reject') {
      this.rejectDevice();
    } else {
      this.confirmDevice();
    }
  }

  confirmDevice(): void {
    if (!this.token) return;

    this.deviceFacade.confirmDevice(this.token).subscribe({
      next: (response) => {

        console.log("device confirmed: ", response?.message);

        this.isProcessing.set(false);
        this.displaySuccess(
          'Appareil confirmé avec succès ! Vous pouvez maintenant utiliser votre compte en toute sécurité.',
          'Continuer vers mon profil',
          5000
        );
        this.buttonAction = () => {
          this.router.navigate(['/'])
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

    this.deviceFacade.rejectDevice(this.token).subscribe({
      next: () => {
        this.isProcessing.set(false);
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
    this.isProcessing.set(false);
    console.log("rejecterror :", error);
    const errorMessage = error.error?.error || alternateMessage;
    this.displayError(errorMessage, 'Retour à l\'accueil');
    this.buttonAction = () => this.router.navigate(['/']);
  }
}
