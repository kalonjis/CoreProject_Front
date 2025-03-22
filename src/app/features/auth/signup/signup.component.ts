import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {provideAuthService} from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  private auth = provideAuthService();
  private fb = inject(FormBuilder);
  private router = inject(Router);

  signupForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  // Regex pour une validation de mot de passe forte
  private passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  ngOnInit(): void {
    // Initialiser le formulaire
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(this.passwordRegex)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validateur personnalisé pour vérifier si les mots de passe correspondent
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.signupForm.controls).forEach(key => {
        const control = this.signupForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.auth.signup(this.signupForm.value).subscribe({
      next: () => {
        // Rediriger vers la page de confirmation ou de login
        //this.router.navigate(['/auth/login'],
        {
          queryParams: { registered: 'true' }
        };
      },
      error: (error: HttpErrorResponse) => {
        if (error.error.error) {
          this.errorMessage = error.error.error;
        } else if (error.error?.errors?.length) {
          // Récupérer le premier message d'erreur de validation
          this.errorMessage = error.error.errors[0];
        } else {
          this.errorMessage = 'Une erreur est survenue lors de l\'inscription.';
        }
        this.isSubmitting = false;
      }
    });
  }

  // Getters pour accéder facilement aux contrôles du formulaire dans le template
  get usernameControl() { return this.signupForm.get('username'); }
  get emailControl() { return this.signupForm.get('email'); }
  get passwordControl() { return this.signupForm.get('password'); }
  get confirmPasswordControl() { return this.signupForm.get('confirmPassword'); }
}
