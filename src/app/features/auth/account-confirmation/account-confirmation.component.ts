import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-account-confirmation',
  standalone: true,
  imports: [
    FeedbackComponent
  ],
  templateUrl: './account-confirmation.component.html',
  styleUrl: './account-confirmation.component.scss'
})
export class AccountConfirmationComponent extends FeedbackBase implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  isProcessing = false;
  token: string | null = null;

  ngOnInit(): void {
    // Extraire le token de l'URL
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');

      if (this.token) {
        this.processToken();
      } else {
        this.displayError('Aucun token de confirmation trouvé dans l\'URL', 'Retour à l\'accueil');
        //this.buttonAction = () => this.router.navigate(['/']);
      }
    });
  }

  processToken(): void {
    this.isProcessing = true;

    if (!this.token) {
      return;
    }

    // Appel API pour confirmer le compte
    this.authService.confirmAccount(this.token)
      .subscribe({
        next: () => {
          this.isProcessing = false;
          this.displaySuccess(
            'Votre compte a été activé avec succès ! Vous pouvez maintenant vous connecter.',
            'Se connecter',
            null
          );
          this.buttonAction = () => {
            this.router.navigate(['/auth/login']);
          };
        },
        error: (error: HttpErrorResponse) => {
          this.isProcessing = false;

          if (error.status === 498) {
            // Token expiré
            this.displayError(
              'Ce lien de confirmation a expiré. Nous pouvons vous en envoyer un nouveau.',
              'Demander un nouveau lien'
            );
            this.buttonAction = () => this.requestNewToken();
          } else {
            // Autres erreurs
            const errorMessage = error.error?.message || 'Une erreur est survenue lors de la confirmation du compte.';
            this.displayError(errorMessage, 'Retour à l\'accueil');
            this.buttonAction = () => this.router.navigate(['/']);
          }
        }
      });
  }

  requestNewToken(): void {
    if (!this.token) {
      return;
    }

    this.isProcessing = true;

    // Appel API pour demander un nouveau token
    this.authService.requestNewConfirmationToken(this.token)
      .subscribe({
        next: () => {
          this.isProcessing = false;
          this.displaySuccess(
            'Un nouveau lien de confirmation a été envoyé à votre adresse e-mail. Veuillez consulter votre boîte de réception.',
            'Retour à l\'accueil',
            null
          );
          this.buttonAction = () => this.router.navigate(['/']);
        },
        error: (error: HttpErrorResponse) => {
          this.isProcessing = false;
          const errorMessage = error.error?.message || 'Une erreur est survenue lors de la demande d\'un nouveau lien.';
          this.displayError(errorMessage, 'Retour à l\'accueil');
          this.buttonAction = () => this.router.navigate(['/']);
        }
      });
  }
}
