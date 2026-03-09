// src/app/features/auth/email-confirmation/email-confirmation.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-email-confirmation',
    imports: [
        FeedbackComponent,
        CommonModule
    ],
    templateUrl: './email-confirmation.component.html',
    styleUrl: './email-confirmation.component.scss'
})
export class EmailConfirmationComponent extends FeedbackBase implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isProcessing = false;
  token: string | null = null;
  action: 'verify' | 'confirm' | 'cancel' | null = null;

  ngOnInit(): void {
    // Extraire le token et l'action de l'URL
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      this.action = params.get('action') as 'verify' | 'confirm' | 'cancel' | null;

      if (!this.token) {
        this.displayError('Aucun token de confirmation trouvé dans l\'URL', 'Retour à mon profil');
        this.buttonAction = () => this.router.navigate(['/profile']);
        return;
      }

      // Si pas d'action spécifiée, déterminer selon le chemin
      if (!this.action) {
        const currentPath = this.router.url.split('?')[0];
        if (currentPath.includes('verify-email')) {
          this.action = 'verify';
        } else if (currentPath.includes('confirm-email')) {
          this.action = 'confirm';
        } else if (currentPath.includes('cancel-email')) {
          this.action = 'cancel';
        }
      }

      // Lancer le processus automatiquement
      this.processRequest();
    });
  }

  processRequest(): void {
    if (!this.token || !this.action) return;

    this.isProcessing = true;

    switch (this.action) {
      case 'verify':
        this.verifyEmailChange();
        break;
      case 'confirm':
        this.confirmEmailChange();
        break;
      case 'cancel':
        this.cancelEmailChange();
        break;
    }
  }

  verifyEmailChange(): void {
    if (!this.token) return;

    /*this.authService.verifyEmailChange(this.token).subscribe({
      next: () => {
        this.isProcessing = false;
        this.displaySuccess(
          'Première étape validée ! Veuillez maintenant consulter votre nouvelle adresse email pour finaliser le changement.',
          'OK',
          null
        );
        this.buttonAction = () => this.router.navigate(['/profile']);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Une erreur est survenue lors de la vérification de votre email.');
      }
    });*/
  }

  confirmEmailChange(): void {
    if (!this.token) return;

   /* this.authService.confirmEmailChange(this.token).subscribe({
      next: () => {
        this.isProcessing = false;
        this.displaySuccess(
          'Votre adresse email a été modifiée avec succès ! Vous pouvez maintenant utiliser votre nouvelle adresse email.',
          'Retour à mon profil',
          null
        );
        this.buttonAction = () => this.router.navigate(['/profile']);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Une erreur est survenue lors de la confirmation de votre nouvelle adresse email.');
      }
    });*/
  }

  cancelEmailChange(): void {
    if (!this.token) return;

    /*this.authService.cancelEmailChange(this.token).subscribe({
      next: () => {
        this.isProcessing = false;
        this.displayWarning(
          'Votre demande de changement d\'email a été annulée. Votre adresse email reste inchangée.',
          'Retour à mon profil',
          null
        );
        this.buttonAction = () => this.router.navigate(['/profile']);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error, 'Une erreur est survenue lors de l\'annulation du changement d\'email.');
      }
    });*/
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): void {
    this.isProcessing = false;
    console.error('Error:', error);

    if (error.status === 498) {
      this.displayError(
        error.error?.message || 'Ce lien a expiré. Veuillez recommencer le processus de changement d\'email.',
        'Retour à mon profil'
      );
    } else if (error.status === 409) {
      this.displayError(
        error.error?.message || 'Cette adresse email est déjà utilisée par un autre compte.',
        'Retour à mon profil'
      );
    } else {
      this.displayError(
        error.error?.message || defaultMessage,
        'Retour à mon profil'
      );
    }

    this.buttonAction = () => this.router.navigate(['/profile']);
  }
}
