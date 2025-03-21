import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {provideAuthService} from '../../../../core/auth/services/auth.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private auth = provideAuthService();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  returnUrl: string = '/';

  ngOnInit(): void {
    // Initialiser le formulaire
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Récupérer l'URL de retour des query params ou utiliser la page d'accueil
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.auth.login(this.loginForm.value).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.errorMessage = 'Login failed. Please check your credentials.';
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        if (error.status === 403) {
          this.errorMessage = 'Account is locked or disabled.';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'An unexpected error occurred. Please try again later.';
        }
        this.isSubmitting = false;
      }
    });
  }

  // Getters pour accéder facilement aux contrôles du formulaire dans le template
  get usernameControl() { return this.loginForm.get('username'); }
  get passwordControl() { return this.loginForm.get('password'); }
}
