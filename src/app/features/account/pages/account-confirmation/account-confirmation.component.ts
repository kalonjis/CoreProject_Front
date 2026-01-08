import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { CommonModule } from '@angular/common';
import {AccountApiService} from '../../../../core/account';

@Component({
  selector: 'app-account-confirmation',
  standalone: true,
  imports: [
    FeedbackComponent,
    CommonModule
  ],
  templateUrl: './account-confirmation.component.html',
  styleUrl: './account-confirmation.component.scss'
})
export class AccountConfirmationComponent extends FeedbackBase implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountApiService: AccountApiService = inject(AccountApiService);

  isProcessing = false;
  token: string | null = null;
  showConfirmationButton = true;

  ngOnInit(): void {
    // Log pour débogage
    console.log('AccountConfirmationComponent initialisé', new Date().toISOString());
    localStorage.setItem('account_confirmation_loaded', 'yes-at-' + new Date().toISOString());

    // Extraire le token de l'URL
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');

      if (!this.token) {
        this.displayError('Aucun token de confirmation trouvé dans l\'URL', 'Retour à l\'accueil');
        this.buttonAction = () => this.router.navigate(['/']);
      }
    });
  }

  // Méthode appelée lorsque l'utilisateur clique sur le bouton de confirmation
  confirmAccount(): void {
    if (!this.token) {
      return;
    }

    this.isProcessing = true;
    this.showConfirmationButton = false;

    this.accountApiService.activateAccount(this.token)
      .subscribe({
        next: (response: any) => {
          console.log('Activation réussie', response);
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
          console.error('Erreur d\'activation:', error);
          this.isProcessing = false;

          if (error.status === 498) {
            // Token expiré
            this.displayError(
              error.error?.error || 'Ce lien de confirmation a expiré. Nous pouvons vous en envoyer un nouveau.',
              'Demander un nouveau lien'
            );
            this.buttonAction = () => this.requestNewToken();
          } else {
              this.handleError(error, 'Une erreur est survenue lors de la confirmation du compte.');
          }
        }
      });
  }

  // Méthode pour demander un nouveau token
  requestNewToken(): void {
    if (!this.token) {
      return;
    }

    this.isProcessing = true;

    // Appel direct à l'API
   /* this.authService.requestNewConfirmationToken(this.token)
      .subscribe({
        next: (response: any) => {
          console.log('Demande de nouveau token réussie', response);
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

          if (error.status === 429) {

            this.displayWarning(
              `Pour des raisons de sécurité, le système limite temporairement les tentatives d'activation. Si
                  vous n'avez pas reçu d'e-mail après plusieurs essais, peut-etre que l'adresse que nous avez fournie ne correspond à aucun utilisateur de notre base de données.
                  Sinon, veuillez réessayer plus tard ou contacter le support.`,
              "J'ai compris",
              null
            );
            this.buttonAction = () => {
              this.router.navigate(['/']);
            };
            return;
          }
          this.handleError(error, 'Une erreur est survenue lors de la demande d\'un nouveau lien.' );
        }
      });*/
  }


  private handleError(error: HttpErrorResponse, alternateMessage: string) {
    console.error(alternateMessage + ': ', error);
    this.isProcessing = false;
    const errorMessage = error.error?.error || alternateMessage;
    this.displayError(errorMessage, 'Retour à l\'accueil');
    this.buttonAction = () => this.router.navigate(['/']);
  }
}
