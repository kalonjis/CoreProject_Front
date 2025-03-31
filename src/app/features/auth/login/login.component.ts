// login.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {AuthService} from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  // État local du composant
  isSubmitting = signal(false);
  loginError = signal<string | null>(null);

  // Formulaire
  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Vérifier les messages depuis l'URL (redirection)
    const params = this.route.snapshot.queryParams;
    if (params['expired'] === 'true') {
      this.loginError.set('Votre session a expiré. Veuillez vous reconnecter.');
    }
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

    this.authService.login(this.loginForm.value as {username: string, password: string})
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);

          // Rediriger vers la page demandée ou l'accueil
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.loginError.set(err.error?.message || 'Échec de connexion');
        }
      });
  }
}
