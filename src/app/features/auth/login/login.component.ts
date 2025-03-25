import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SessionService } from '../../../core/auth/services/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sessionService = inject(SessionService);

  loginForm!: FormGroup;
  isSubmitting = signal(false);

  // Signaux pour afficher les messages à l'utilisateur
  showSuccessMessage = signal(false);
  successMessage = signal('');

  // Signal calculé à partir de l'état du service de session
  errorMessage = computed(() => this.sessionService.error());

  ngOnInit(): void {
    // Initialiser le formulaire
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Vérifier les query params pour afficher des messages
    const params = this.route.snapshot.queryParams;
    if (params['registered'] === 'true') {
      this.showSuccessMessage.set(true);
      this.successMessage.set('Inscription réussie ! Vous pouvez maintenant vous connecter.');
    }
    if (params['reset'] === 'true') {
      this.showSuccessMessage.set(true);
      this.successMessage.set('Votre mot de passe a été réinitialisé avec succès.');
    }
    if (params['session-expired'] === 'true') {
      // Pas besoin d'utiliser errorMessage ici car c'est propre à l'URL et non à une erreur d'API
      this.showSuccessMessage.set(false);
      this.successMessage.set('');
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);

    this.sessionService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        // La redirection est gérée par le service de session
      },
      error: () => {
        this.isSubmitting.set(false);
        // Les erreurs sont gérées par le service de session
      }
    });
  }

  // Getters pour un accès facile aux contrôles du formulaire dans le template
  get usernameControl() { return this.loginForm.get('username'); }
  get passwordControl() { return this.loginForm.get('password'); }
}
