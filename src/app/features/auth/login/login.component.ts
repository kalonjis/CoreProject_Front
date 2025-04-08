// login.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/services/auth.service';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FeedbackComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent extends FeedbackBase implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  // État local du composant
  isSubmitting = signal(false);
  loginError = signal<string | null>(null);
  unactivatedUsername = signal<string>('');

  // Formulaire
  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Vérifier les messages depuis l'URL (redirection)
    this.route.queryParams.subscribe(params => {
      if (params['passwordChanged'] === 'true') {
        this.displaySuccess(
          'Votre mot de passe a été modifié avec succès. Veuillez vous reconnecter avec votre nouveau mot de passe.',
          '',
          5000 // Disparaît après 5 secondes
        );
      }

      if (params['expired'] === 'true') {
        this.displayWarning('Votre session a expiré. Veuillez vous reconnecter.', '', 5000);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Marque tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.loginError.set(null);
    this.clearFeedback();

    const credentials = {
      username: this.loginForm.value.username || '',
      password: this.loginForm.value.password || ''
    };

    this.authService.login(credentials)
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);

          // Rediriger vers la page demandée ou l'accueil
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);

          // Classifier les erreurs selon leur type

          // 1. Erreurs métier/système qui nécessitent action ou attention particulière
          if (err.status === 403 &&
            err.error?.error &&
            (err.error.error.includes('never been activated') ||
              err.error.error.includes('has not been activated'))) {

            // Cas d'un compte non activé - utiliser le système de feedback
            this.unactivatedUsername.set(credentials.username);
            this.displayWarning(
              "Votre compte n'a pas encore été activé. Veuillez vérifier votre boîte mail ou demander un nouveau lien d'activation.",
              "Demander un nouveau lien",
              null
            );

            // Définir l'action du bouton de feedback
            this.buttonAction = () => this.requestNewActivationLink();
            return;
          }

          // Compte désactivé par un administrateur - utiliser le système de feedback
          if (err.status === 403 &&
            err.error?.error &&
            err.error.error.includes('disabled by an administrator')) {

            this.displayError(
              "Votre compte a été désactivé par un administrateur. Veuillez contacter le support pour plus d'informations.",
              "Contacter le support",
              null
            );

            this.buttonAction = () => {
              // Rediriger vers la page de contact ou ouvrir un email
              window.location.href = "mailto:support@votreapp.com";
            };
            return;
          }

          // 2. Erreurs de connexion standard liées à la validation - afficher dans le formulaire
          this.loginError.set(err.error?.error || 'Échec de connexion. Vérifiez vos identifiants.');
        }
      });
  }

  requestNewActivationLink(): void {
    const username = this.unactivatedUsername();
    if (!username) return;

    this.isSubmitting.set(true);

    this.authService.requestNewActivationByUsername(username)
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);

          // Utiliser le système de feedback pour confirmer l'envoi
          this.displaySuccess(
            'Un nouveau lien d\'activation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception.',
            'OK',
            null
          );

          this.buttonAction = () => {
            this.clearFeedback();
            this.loginForm.reset();
          };
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);

          if (error.status === 429) {
            // Limitation de taux (trop de tentatives)
            this.displayWarning(
              'Pour des raisons de sécurité, le système limite temporairement les tentatives d\'activation. Veuillez réessayer plus tard ou contacter le support.',
              'J\'ai compris',
              null
            );
          } else {
            // Autre erreur
            this.displayError(
              error.error?.error || 'Une erreur est survenue lors de la demande du lien d\'activation.',
              'Fermer'
            );
          }

          this.buttonAction = () => {
            this.clearFeedback();
          };
        }
      });
  }
}
