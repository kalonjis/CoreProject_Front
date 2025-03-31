import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { CommonModule } from '@angular/common';

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
  private http = inject(HttpClient);

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

    // Créer des en-têtes spéciaux pour contourner l'intercepteur
    const headers = new HttpHeaders().set('X-Skip-Interceptor', 'true');

    // Appel direct à l'API
    this.http.get(`/api/account-confirmation/activation?token=${this.token}`, { headers })
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

  // Méthode pour demander un nouveau token
  requestNewToken(): void {
    if (!this.token) {
      return;
    }

    this.isProcessing = true;

    // Créer des en-têtes spéciaux pour contourner l'intercepteur
    const headers = new HttpHeaders().set('X-Skip-Interceptor', 'true');

    // Appel direct à l'API
    this.http.get(`/api/account-confirmation/request-activation?token=${this.token}`, { headers })
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
          console.error('Erreur de demande de nouveau token:', error);
          this.isProcessing = false;
          const errorMessage = error.error?.message || 'Une erreur est survenue lors de la demande d\'un nouveau lien.';
          this.displayError(errorMessage, 'Retour à l\'accueil');
          this.buttonAction = () => this.router.navigate(['/']);
        }
      });
  }
}
