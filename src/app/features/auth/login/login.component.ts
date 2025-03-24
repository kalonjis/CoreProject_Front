// src/app/features/auth/login/login.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { provideAuthStore } from '../../../core/auth/providers/auth.provider';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private authStore = provideAuthStore();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  isSubmitting = false;
  returnUrl: string = '/';

  // Expose the error from the store
  get errorMessage() {
    return this.authStore.error();
  }

  ngOnInit(): void {
    // Clear any previous errors
    this.authStore.clearErrors();

    // Initialize the form
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to display errors
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    this.authStore.login(this.loginForm.value).subscribe({
      next: () => {
        // Navigation is handled in the store
        this.isSubmitting = false;
      },
      error: () => {
        this.isSubmitting = false;
        // Error is handled in the store
      }
    });
  }

  // Getters for easy access to form controls in the template
  get usernameControl() { return this.loginForm.get('username'); }
  get passwordControl() { return this.loginForm.get('password'); }
}
