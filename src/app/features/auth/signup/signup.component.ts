import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OldAuthService } from '../../../core/auth/services/old.auth.service';
import { FeedbackService } from '../../../shared/feedback/tools/feedback.service';
import {HttpErrorResponse} from '@angular/common/http';
import {UserSignupForm} from '../../../data/models/auth/user-signup-form';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(OldAuthService);
  private feedbackService = inject(FeedbackService);

  // État local du composant
  isSubmitting = signal(false);
  signupError = signal<string | null>(null);
  showPassword = false;

  // Validators pour la force du mot de passe
  passwordHasMinLength = false;
  passwordHasUppercase = false;
  passwordHasLowercase = false;
  passwordHasNumber = false;
  passwordHasSpecialChar = false;

  // Fonction utilitaire pour vérifier si les mots de passe correspondent
  passwordMatchValidator = (): { [key: string]: boolean } | null => {
    if (!this.signupForm) return null;

    const password = this.signupForm.get('password')?.value;
    const confirmPassword = this.signupForm.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { 'passwordMismatch': true };
    }

    return null;
  };

  // Formulaire d'inscription
  signupForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: [this.passwordMatchValidator] });

  constructor() {
    // Observer les changements du mot de passe pour mettre à jour les indicateurs de force
    this.signupForm.get('password')?.valueChanges.subscribe(password => {
      if (password) {
        this.updatePasswordStrength(password);
      } else {
        this.resetPasswordStrength();
      }
    });
  }

  // Méthode pour basculer la visibilité du mot de passe
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Mettre à jour les indicateurs de force du mot de passe
  updatePasswordStrength(password: string): void {
    this.passwordHasMinLength = password.length >= 8;
    this.passwordHasUppercase = /[A-Z]/.test(password);
    this.passwordHasLowercase = /[a-z]/.test(password);
    this.passwordHasNumber = /\d/.test(password);
    this.passwordHasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  }

  // Réinitialiser les indicateurs de force du mot de passe
  resetPasswordStrength(): void {
    this.passwordHasMinLength = false;
    this.passwordHasUppercase = false;
    this.passwordHasLowercase = false;
    this.passwordHasNumber = false;
    this.passwordHasSpecialChar = false;
  }

  // Soumission du formulaire
  onSubmit(): void {
    if (this.signupForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Préparation des données pour l'API
    const formData: UserSignupForm = {
      username: this.signupForm.value.username || '',
      email: this.signupForm.value.email || '',
      password: this.signupForm.value.password || '',
      confirmPassword: this.signupForm.value.confirmPassword || ''
    };

    this.isSubmitting.set(true);
    this.signupError.set(null);

    this.authService.signup(formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);

        // Afficher un message de succès
        this.feedbackService.showSuccess(
          "Votre compte a été créé avec succès. Un email de confirmation vous a été envoyé.",
          "Se connecter",
          10000 // 10 secondes
        );

        // Reset du formulaire
        this.signupForm.reset();

        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 5000);
      },
      error: (err:HttpErrorResponse) => {
        this.isSubmitting.set(false);

        // Gestion des erreurs de validation
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          this.signupError.set(err.error.errors.join('\n'));
          this.feedbackService.showError(err.error.errors.join('\n'));
        } else if (err.error?.globalErrors && Array.isArray(err.error.globalErrors)) {
          this.signupError.set(err.error.globalErrors.join('\n'));
          this.feedbackService.showError(err.error.globalErrors.join('\n'));
        } else {
          const errorMsg = err.error?.message || 'Une erreur s\'est produite lors de l\'inscription.';
          this.signupError.set(errorMsg);
          this.feedbackService.showError(errorMsg);
        }
      }
    });
  }
}
