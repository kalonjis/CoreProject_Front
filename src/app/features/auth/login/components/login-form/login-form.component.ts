// login-form.component.ts
import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface LoginFormData {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  private fb = inject(FormBuilder);

  @Input() isSubmitting = false;
  @Output() submitLogin = new EventEmitter<LoginFormData>();

  // Reactive Form
  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.loginForm.valid && !this.isSubmitting) {
      const formData: LoginFormData = {
        username: this.loginForm.value.username!,
        password: this.loginForm.value.password!
      };

      this.submitLogin.emit(formData);
    }
  }

  /**
   * Gets field validation state for display
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  /**
   * Gets specific validation error for a field
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (field?.hasError('required')) {
      return fieldName === 'username' ? 'Username is required' : 'Password is required';
    }

    return '';
  }
}
