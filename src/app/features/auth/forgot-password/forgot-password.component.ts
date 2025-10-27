import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackService } from '../../../shared/feedback/tools/feedback.service';
import { OldAuthService } from '../../../core/auth/services/old.auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FeedbackComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent extends FeedbackBase {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService: OldAuthService = inject(OldAuthService);
  private feedbackService = inject(FeedbackService);

  // État local du composant
  isSubmitting = signal(false);
  resetRequested = signal(false);

  // Formulaire
  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.resetForm.invalid) {
      // Marque tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.resetForm.controls).forEach(key => {
        this.resetForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Utiliser une valeur par défaut vide au cas où email serait undefined
    const email = this.resetForm.value.email || '';

    // Vérification supplémentaire (redondante avec la validation du formulaire)
    if (email.trim() === '') {
      return;
    }

    this.isSubmitting.set(true);
    this.clearFeedback();

    // Utilisation de l'OldAuthService pour la réinitialisation du mot de passe
    this.authService.requestPasswordReset(email).subscribe({
      next: (response: any) => {
        this.isSubmitting.set(false);
        this.resetRequested.set(true);

        // Afficher un message de succès
        this.displaySuccess(
          `Si l'adresse e-mail ${email} correspond à un compte existant, vous recevrez un e-mail avec les instructions pour réinitialiser votre mot de passe.`,
          'Retour à la connexion',
          null // pas de timeout automatique
        );

        this.buttonAction = () => {
          this.router.navigate(['/auth/login']);
        };
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);

        // Par sécurité, on affiche toujours le même message, même en cas d'erreur
        // pour ne pas divulguer d'informations sur l'existence d'un compte
        this.resetRequested.set(true);

        if (error.status === 429) {
          this.displayWarning(
            `Pour des raisons de sécurité, le système limite temporairement les tentatives de réinitialisation. Si l'adresse e-mail ${email} correspond à un compte existant mais
                que vous n'avez pas reçu d'e-mail après plusieurs essais, veuillez réessayer plus tard ou contacter le support.`,
            "J'ai compris",
            null
          );
          this.buttonAction = () => {
            this.router.navigate(['/']);
          };
          return;
        }
        this.displaySuccess(
          `Si l'adresse e-mail ${email} correspond à un compte existant, vous recevrez un e-mail avec les instructions pour réinitialiser votre mot de passe.`,
          'Retour à la connexion',
          null
        );

        this.buttonAction = () => {
          this.router.navigate(['/auth/login']);
        };

        // Pour le débogage seulement
        console.error('Error during password reset request:', error);
      }
    });
  }
}
