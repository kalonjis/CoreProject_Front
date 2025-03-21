import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {provideAuthService} from '../../../core/auth/services/auth.service';
import {HttpErrorResponse} from '@angular/common/http';


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
      next: (response) => {
        this.auth.defineAuthenticated(true);
        this.auth.loadCurrentUser().subscribe({
          next: (user) => {
            this.auth.defineUser(user);
            console.log(user);
           // this.router.navigateByUrl(this.returnUrl);
          },
          error: (error:HttpErrorResponse) => {
            this.auth.defineAuthenticated(false);
            if (error.error.error) {
              this.errorMessage = error.error.error;
            } else {
              this.errorMessage = "Impossible de charger les informations utilisateur.";
            }
            this.isSubmitting = false;
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.log(error);
        if (error.error.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = 'Une erreur s\'est produite lors de la connexion.';
        }
        this.isSubmitting = false;
      }
    });
  }

  // Getters pour accéder facilement aux contrôles du formulaire dans le template
  get usernameControl() { return this.loginForm.get('username'); }
  get passwordControl() { return this.loginForm.get('password'); }
}
