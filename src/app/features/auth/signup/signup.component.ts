// src/app/features/auth/signup/signup.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { provideAuthStore } from '../../../core/auth/providers/auth.provider';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  private authStore = provideAuthStore();
  private fb = inject(FormBuilder);

  signupForm!: FormGroup;
  isSubmitting = false;

  // Regex for strong password validation
  private passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Expose the error from the store
  get errorMessage() {
    return this.authStore.error();
  }

  ngOnInit(): void {
    // Clear any previous errors
    this.authStore.clearErrors();

    // Initialize the form
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

  // Custom validator to check if passwords match
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
      // Mark all fields as touched to display errors
      Object.keys(this.signupForm.controls).forEach(key => {
        const control = this.signupForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    this.authStore.signup(this.signupForm.value).subscribe({
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
  get usernameControl() { return this.signupForm.get('username'); }
  get emailControl() { return this.signupForm.get('email'); }
  get passwordControl() { return this.signupForm.get('password'); }
  get confirmPasswordControl() { return this.signupForm.get('confirmPassword'); }
}
