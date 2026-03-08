  import { Component, inject, signal, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
  import { Router, RouterLink, ActivatedRoute } from '@angular/router';
  import { HttpErrorResponse } from '@angular/common/http';
  import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
  import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
  import { FeedbackService } from '../../../shared/feedback/tools/feedback.service';
  import {AuthFacade} from '../../../core/auth';
  import {PasswordApiService} from '../services/password-api.service';

  @Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, FeedbackComponent],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.scss'
  })
  export class ResetPasswordComponent extends FeedbackBase implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private authFacade: AuthFacade = inject(AuthFacade);
    private passwordApiService: PasswordApiService = inject(PasswordApiService);
    private feedbackService = inject(FeedbackService);

    // État local du composant
    isSubmitting = signal(false);
    resetCompleted = signal(false);
    showPassword = signal(false);
    token: string | null = null;

    // Indicateurs de force du mot de passe
    passwordHasMinLength = signal(false);
    passwordHasUppercase = signal(false);
    passwordHasLowercase = signal(false);
    passwordHasNumber = signal(false);
    passwordHasSpecialChar = signal(false);

    // Fonction de validation pour vérifier que les mots de passe correspondent
    passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      if (password && confirmPassword && password !== confirmPassword) {
        return { 'passwordMismatch': true };
      }

      return null;
    };

    // Formulaire
    resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: [this.passwordMatchValidator] });

    ngOnInit(): void {
      // Extraire le token de réinitialisation de l'URL
      this.route.queryParamMap.subscribe(params => {
        const tokenParam = params.get('token');
        if (tokenParam) {
          this.token = tokenParam;
        } else {
          this.displayError(
            'Aucun token de réinitialisation trouvé. Veuillez demander une nouvelle réinitialisation de mot de passe.',
            'Retour'
          );
          this.buttonAction = () => this.router.navigate(['/auth/forgot-password']);
        }
      });

      // Observer les changements du mot de passe pour mettre à jour les indicateurs de force
      this.resetPasswordForm.get('password')?.valueChanges.subscribe(password => {
        if (password) {
          this.updatePasswordStrength(password);
        } else {
          this.resetPasswordStrength();
        }
      });
    }

    // Méthode pour basculer la visibilité du mot de passe
    togglePasswordVisibility(): void {
      this.showPassword.update(value => !value);
    }

    // Mettre à jour les indicateurs de force du mot de passe
    updatePasswordStrength(password: string): void {
      this.passwordHasMinLength.set(password.length >= 8);
      this.passwordHasUppercase.set(/[A-Z]/.test(password));
      this.passwordHasLowercase.set(/[a-z]/.test(password));
      this.passwordHasNumber.set(/\d/.test(password));
      this.passwordHasSpecialChar.set(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
    }

    // Réinitialiser les indicateurs de force du mot de passe
    resetPasswordStrength(): void {
      this.passwordHasMinLength.set(false);
      this.passwordHasUppercase.set(false);
      this.passwordHasLowercase.set(false);
      this.passwordHasNumber.set(false);
      this.passwordHasSpecialChar.set(false);
    }

    onSubmit(): void {
      if (this.resetPasswordForm.invalid || !this.token) {
        // Marquer tous les champs comme touchés pour afficher les erreurs
        Object.keys(this.resetPasswordForm.controls).forEach(key => {
          this.resetPasswordForm.get(key)?.markAsTouched();
        });
        return;
      }

      const formData = {
        password: this.resetPasswordForm.value.password || '',
        confirmPassword: this.resetPasswordForm.value.confirmPassword || ''
      };

      this.isSubmitting.set(true);
      this.clearFeedback();

      // Utiliser des valeurs par défaut pour éviter les problèmes de type null/undefined
      const password = this.resetPasswordForm.value.password || '';
      const confirmPassword = this.resetPasswordForm.value.confirmPassword || '';
      const token = this.token || '';

      // Vérification supplémentaire
      if (password.trim() === '' || confirmPassword.trim() === '' || token.trim() === '') {
        this.isSubmitting.set(false);
        return;
      }

      this.passwordApiService.resetPassword(token, formData)
        .subscribe({
          next: (response: any) => {
            this.isSubmitting.set(false);
            this.resetCompleted.set(true);

            // Afficher un message de succès
            this.displaySuccess(
              'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
              'Se connecter',
              null // pas de timeout automatique
            );

            this.buttonAction = () => {
              this.router.navigate(['/auth/login']);
            };
          },
          error: (error: HttpErrorResponse) => {
            console.error(error);
            this.isSubmitting.set(false);

            if(error.status === 404){
              this.displayError(
                'Le lien de réinitialisation que vous avez utilisé est incomplet ou n\'est plus valide. ' +
                'Veuillez demander un nouveau lien de réinitialisation de mot de passe.',
                'Demander un nouveau lien'
              );
              this.buttonAction = () => this.requestNewToken();
              return;
            }

            if (error.status === 498) {
              // Token expiré
              this.displayError(
                'Ce lien de réinitialisation a expiré. Veuillez demander une nouvelle réinitialisation.',
                'Demander un nouveau lien'
              );
              this.buttonAction = () => this.requestNewToken();
              return;
            }

            this.handleError(error, 'Une erreur est survenue lors de la réinitialisation du mot de passe.');
          }
        });
    }

    requestNewToken(): void{
      if (!this.token){
        return
      }

      this.isSubmitting.set(true);

      this.passwordApiService.resendResetToken(this.token)
      .subscribe({
        next: (response: any) => {
          this.isSubmitting.set(false);
          this.resetCompleted.set(true);
          this.displaySuccess(
            'Un nouveau lien de confirmation a été envoyé à votre adresse e-mail. Veuillez consulter votre boîte de réception.',
            'Retour à l\'accueil',
            null
          );
          this.buttonAction = () => this.router.navigate(['/']);

        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'Une erreur est survenue lors de la demande d\'un nouveau lien.' )
        }
      })
    }


    private handleError(error: HttpErrorResponse, alternateMessage: string): void {
      console.error(alternateMessage + ': ', error);
      this.isSubmitting.set(false);
      const errorMessage = error.error?.error || alternateMessage;
      this.displayError(errorMessage,'Retour à l\'accueil');
      this.buttonAction = () => this.router.navigate(['/']);

    }
  }
