// src/app/features/profile/profile.component.ts
import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/services/auth.service';
import { DeviceService } from '../../data/services/device-service.service';
import { Device } from '../../data/models/device/device';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, retry, of, finalize } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  authService = inject(AuthService);
  deviceService = inject(DeviceService);

  // User profile information
  userInfo = signal<any>(null);
  devices = signal<Device[]>([]);

  // UI state signals
  isLoading = signal(true);
  isLoadingDevices = signal(true);
  editMode = signal(false);
  changeEmailMode = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Pour gérer les tentatives de chargement
  retryAttempts = 0;
  maxRetries = 3;

  // Forms
  profileForm!: FormGroup;
  emailForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
    this.loadUserDevices();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      phoneNumber: ['', [Validators.pattern('^[0-9+\\-\\s]+$')]]
    });

    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required, Validators.email]]
    });
  }

  private loadUserProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<any>('/api/auth/me')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        // Attendre jusqu'à 3 secondes avant d'afficher une erreur
        // Cela donne le temps au refresh token de s'exécuter
        retry({ count: 2, delay: 1500 }),
        catchError(err => {
          console.error('Failed to load profile after retries', err);
          this.errorMessage.set('Failed to load profile data');
          return of(null);
        }),
        finalize(() => {
          // Toujours exécuté, que la requête réussisse ou échoue
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.userInfo.set(data);
            this.populateForm(data);
            this.errorMessage.set(null);
          }
        }
      });
  }

  private loadUserDevices(): void {
    this.isLoadingDevices.set(true);

    this.deviceService.getMyDevices()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        retry({ count: 2, delay: 1500 }),
        catchError(err => {
          console.error('Failed to load devices', err);
          return of([]);
        }),
        finalize(() => {
          this.isLoadingDevices.set(false);
        })
      )
      .subscribe({
        next: (devices) => {
          this.devices.set(devices);
        }
      });
  }

  private populateForm(data: any): void {
    if (!data) return;

    this.profileForm.patchValue({
      firstname: data.firstname || '',
      lastname: data.lastname || '',
      phoneNumber: data.phoneNumber || ''
    });

    this.emailForm.patchValue({
      email: '',
      confirmEmail: ''
    });
  }

  toggleEditMode(): void {
    this.editMode.set(!this.editMode());
    if (!this.editMode()) {
      // Reset form when canceling edit
      this.populateForm(this.userInfo());
    }
  }

  toggleChangeEmailMode(): void {
    this.changeEmailMode.set(!this.changeEmailMode());
    if (!this.changeEmailMode()) {
      // Reset email form
      this.emailForm.reset();
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.put('/api/user/profile', this.profileForm.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to update profile', err);
          this.errorMessage.set(err.error?.message || 'Failed to update profile');
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          if (response !== null) {
            // Refresh user data
            this.loadUserProfile();
            this.successMessage.set('Profile updated successfully');
            this.toggleEditMode();
          }
        }
      });
  }

  requestEmailChange(): void {
    if (this.emailForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.emailForm.controls).forEach(key => {
        this.emailForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check if emails match
    if (this.emailForm.value.email !== this.emailForm.value.confirmEmail) {
      this.errorMessage.set('Email addresses do not match');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.post('/api/auth/change-email-request', this.emailForm.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to request email change', err);
          this.errorMessage.set(err.error?.message || 'Failed to request email change');
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          if (response !== null) {
            this.successMessage.set('Email change request sent. Please check your current email address for confirmation.');
            this.toggleChangeEmailMode();
          }
        }
      });
  }

  initiatePasswordChange(): void {
    // Navigate to change password page
    window.location.href = '/auth/change-password';
  }

  getRecentDevices(): Device[] {
    // Return the 3 most recent devices
    return this.devices().slice(0, 3);
  }

  formatDate(date: string): string {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  }

  // Si l'utilisateur veut forcer le rechargement des données
  retryLoading(): void {
    this.loadUserProfile();
    this.loadUserDevices();
  }
}
