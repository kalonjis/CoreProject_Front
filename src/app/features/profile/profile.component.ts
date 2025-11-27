import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, retry, of, finalize } from 'rxjs';

import { AuthFacade } from '../../core/auth';
import { DeviceApiService } from '../../core/device';
import { HttpUtilService } from '../../core/http';
import { Device } from '../../data/models/device/device';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpUtilService);
  protected readonly auth = inject(AuthFacade);
  private readonly deviceApi = inject(DeviceApiService);

  // User profile information
  userInfo = signal<any>(null);
  devices = signal<Device[]>([]);
  private readonly MAX_RECENT_DEVICES = 3;

  // UI state signals
  isLoading = signal(true);
  isLoadingDevices = signal(true);
  editMode = signal(false);
  changeEmailMode = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Phone verification signals
  private phoneValid = signal(false);
  private phoneVerified = signal(false);
  private sendingCode = signal(false);
  private verifying = signal(false);
  private showModal = signal(false);
  private statusMessage = signal('');
  private codeArray = signal(['', '', '', '', '', '']);

  // Readonly getters for template
  isPhoneValid = this.phoneValid.asReadonly();
  isPhoneVerified = this.phoneVerified.asReadonly();
  isSendingCode = this.sendingCode.asReadonly();
  isVerifying = this.verifying.asReadonly();
  showVerificationModal = this.showModal.asReadonly();
  phoneStatusMessage = this.statusMessage.asReadonly();
  verificationCode = this.codeArray.asReadonly();

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
        retry({ count: 2, delay: 1500 }),
        catchError(err => {
          console.error('Failed to load profile', err);
          this.errorMessage.set('Failed to load profile data');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.userInfo.set(data);
            this.populateForm(data);
            this.phoneVerified.set(data.phoneNumberVerified || false);
            this.errorMessage.set(null);
          }
        }
      });
  }

  protected loadUserDevices(): void {
    this.isLoadingDevices.set(true);

    this.deviceApi.getMyDevices()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        retry({ count: 2, delay: 1500 }),
        catchError(err => {
          console.error('Failed to load devices', err);
          return of([]);
        }),
        finalize(() => this.isLoadingDevices.set(false))
      )
      .subscribe({
        next: (devices) => this.devices.set(devices)
      });
  }

  private populateForm(data: any): void {
    if (!data) return;

    this.profileForm.patchValue({
      firstname: data.firstname || '',
      lastname: data.lastname || '',
      phoneNumber: data.phoneNumber || ''
    });

    this.emailForm.reset();
  }

  // =========================================================================
  // UI ACTIONS
  // =========================================================================

  toggleEditMode(): void {
    this.editMode.update(v => !v);
    if (!this.editMode()) {
      this.populateForm(this.userInfo());
    }
  }

  toggleChangeEmailMode(): void {
    this.changeEmailMode.update(v => !v);
    if (!this.changeEmailMode()) {
      this.emailForm.reset();
    }
  }

  retryLoading(): void {
    this.loadUserProfile();
  }

  initiatePasswordChange(): void {
    this.router.navigate(['/auth/change-password']);
  }

  // =========================================================================
  // PROFILE UPDATE
  // =========================================================================

  updateProfile(): void {
    if (this.profileForm.invalid) {
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
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response !== null) {
            this.loadUserProfile();
            this.auth.reloadSession().subscribe();
            this.successMessage.set('Profile updated successfully');
            this.toggleEditMode();
          }
        }
      });
  }

  requestEmailChange(): void {
    if (this.emailForm.invalid) {
      Object.keys(this.emailForm.controls).forEach(key => {
        this.emailForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.emailForm.value.email !== this.emailForm.value.confirmEmail) {
      this.errorMessage.set('Les adresses email ne correspondent pas');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.post('/api/user/change-email-request', {
      email: this.emailForm.value.email,
      confirmEmail: this.emailForm.value.confirmEmail
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.errorMessage.set(err.error?.message || 'Échec de la demande');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response !== null) {
            this.successMessage.set('Demande envoyée. Vérifiez votre email.');
            this.toggleChangeEmailMode();
          }
        }
      });
  }

  // =========================================================================
  // PHONE VERIFICATION
  // =========================================================================

  onPhoneChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const phone = input.value;
    const isValid = /^[0-9+\-\s]{10,}$/.test(phone);
    this.phoneValid.set(isValid);

    if (!isValid) {
      this.statusMessage.set('');
    }
  }

  sendVerificationCode(): void {
    if (this.sendingCode() || !this.phoneValid()) return;

    this.sendingCode.set(true);
    this.statusMessage.set('');

    this.http.post('/api/profile/SMS/request-verification', {
      phoneNumber: this.profileForm.get('phoneNumber')?.value
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.statusMessage.set(err.error?.message || 'Failed to send code');
          return of(null);
        }),
        finalize(() => this.sendingCode.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response !== null) {
            this.statusMessage.set('Code sent to your phone');
            this.showModal.set(true);
            this.codeArray.set(['', '', '', '', '', '']);
          }
        }
      });
  }

  verifyCode(): void {
    if (this.verifying() || !this.isCodeComplete()) return;

    this.verifying.set(true);

    const code = this.codeArray().join('');

    this.http.post('/api/profile/SMS/verify', { code })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.statusMessage.set(err.error?.message || 'Invalid code');
          return of(null);
        }),
        finalize(() => this.verifying.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response !== null) {
            this.phoneVerified.set(true);
            this.statusMessage.set('Phone verified successfully');
            this.closeVerificationModal();
            this.loadUserProfile();
          }
        }
      });
  }

  isCodeComplete(): boolean {
    return this.codeArray().every(digit => digit !== '');
  }

  onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value.length === 1 && /^\d$/.test(value)) {
      const newCode = [...this.codeArray()];
      newCode[index] = value;
      this.codeArray.set(newCode);

      // Auto-focus next input
      if (index < 5) {
        const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
        nextInput?.focus();
      }
    } else {
      input.value = '';
    }
  }

  onCodeKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const newCode = [...this.codeArray()];

      if (newCode[index]) {
        newCode[index] = '';
        this.codeArray.set(newCode);
      } else if (index > 0) {
        const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
        prevInput?.focus();
      }
    }
  }

  closeVerificationModal(): void {
    this.showModal.set(false);
    this.codeArray.set(['', '', '', '', '', '']);
  }

  closeModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('verification-overlay')) {
      this.closeVerificationModal();
    }
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  get recentDevices(): Device[] {
    return this.devices().slice(0, this.MAX_RECENT_DEVICES);
  }

  getRecentDevices(): Device[] {
    return this.recentDevices;
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
