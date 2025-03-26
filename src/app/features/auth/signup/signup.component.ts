import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../../core/auth/services/session.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private sessionService = inject(SessionService);

  signupForm!: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Regex for strong password validation
  private passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  ngOnInit(): void {
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

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.sessionService.signup(this.signupForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        // Navigation is handled in the service
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message || 'An error occurred during signup');
      }
    });
  }

  // Getters for easy access to form controls in the template
  get usernameControl() { return this.signupForm.get('username'); }
  get emailControl() { return this.signupForm.get('email'); }
  get passwordControl() { return this.signupForm.get('password'); }
  get confirmPasswordControl() { return this.signupForm.get('confirmPassword'); }
}
