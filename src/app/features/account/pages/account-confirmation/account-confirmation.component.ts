import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { CommonModule } from '@angular/common';
import { AccountApiService } from '../../services';

@Component({
    selector: 'app-account-confirmation',
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
  private accountApiService = inject(AccountApiService);

  isProcessing = signal(false);
  token: string | null = null;
  showConfirmationButton = signal(true);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');

      if (!this.token) {
        this.displayError('Aucun token de confirmation trouvé dans l\'URL', 'Retour à l\'accueil');
        this.buttonAction = () => this.router.navigate(['/']);
      }
    });
  }

  confirmAccount(): void {
    if (!this.token) return;

    this.isProcessing.set(true);
    this.showConfirmationButton.set(false);

    this.accountApiService.activateAccount(this.token).subscribe({
      next: () => {
        console.log('[AccountConfirmation] next() appelé — activation réussie');
        this.isProcessing.set(false);
        this.displaySuccess(
          'Votre compte a été activé avec succès ! Vous pouvez maintenant vous connecter.',
          'Se connecter'
        );
        this.buttonAction = () => this.router.navigate(['/auth/login']);
      },
      error: (error: HttpErrorResponse) => {
        console.log('[AccountConfirmation] error() appelé — statut:', error.status);
        this.isProcessing.set(false);

        if (error.status === 498) {
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

  requestNewToken(): void {
    if (!this.token) return;
    this.isProcessing.set(true);
    this.accountApiService.resendActivation(this.token).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.displaySuccess('Un nouvel email d\'activation a été envoyé.', 'Fermer');
        this.buttonAction = () => this.clearFeedback();
      },
      error: () => {
        this.isProcessing.set(false);
        this.displayError('Impossible d\'envoyer l\'email. Veuillez réessayer.', 'Réessayer');
        this.buttonAction = () => this.requestNewToken();
      }
    });
  }

  private handleError(error: HttpErrorResponse, alternateMessage: string): void {
    const errorMessage = error.error?.error || alternateMessage;
    this.displayError(errorMessage, 'Retour à l\'accueil');
    this.buttonAction = () => this.router.navigate(['/']);
  }
}
