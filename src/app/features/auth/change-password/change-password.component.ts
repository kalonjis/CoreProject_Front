import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FeedbackComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent extends FeedbackBase {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // État local du composant
  isSubmitting = signal(false);
  showPassword = signal(false);
  showCurrentPassword = signal(false);

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
  changePasswordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: [this.passwordMatchValidator] });

  constructor() {
    super();

    // Observer les changements du mot de passe pour mettre à jour les indicateurs de force
    this.changePasswordForm.get('password')?.valueChanges.subscribe(password => {
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

  // Méthode pour basculer la visibilité du mot de passe actuel
  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.update(value => !value);
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
    if (this.changePasswordForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.clearFeedback();

    // Préparer les données du formulaire
    const formData = {
      currentPassword: this.changePasswordForm.value.currentPassword || '',
      password: this.changePasswordForm.value.password || '',
      confirmPassword: this.changePasswordForm.value.confirmPassword || ''
    };

    // Appeler le service d'authentification
    this.authService.changePassword(formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);

        // Afficher un message de succès
        this.displaySuccess(
          'Votre mot de passe a été modifié avec succès.',
          'Retour à mon profil',
          null
        );

        this.buttonAction = () => {
          this.router.navigate(['/profile']);
        };
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);

        if (error.status === 400) {
          // Erreur de validation
          this.displayError(
            error.error?.message || 'Les données fournies ne sont pas valides. Veuillez vérifier votre saisie.',
            'Réessayer'
          );
        } else if (error.status === 403) {
          // Mot de passe actuel incorrect
          this.displayError(
            error.error?.message || 'Le mot de passe actuel est incorrect.',
            'Réessayer'
          );
        } else {
          // Autre erreur
          this.displayError(
            error.error?.message || 'Une erreur est survenue lors du changement de mot de passe.',
            'Réessayer'
          );
        }

        this.buttonAction = () => {
          this.clearFeedback();
        };
      }
    });
  }
}
