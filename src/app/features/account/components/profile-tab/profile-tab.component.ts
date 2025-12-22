// src/app/features/profile/profile.component.ts
import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, retry, of, finalize } from 'rxjs';
import {HttpUtilService} from '../../../../core/http/http-util.service';
import {DeviceFacade} from '../../../../core/device';
import {AuthFacade} from '../../../../core/auth';

@Component({
  selector: 'app-profile-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-tab.component.html',
  styleUrl: './profile-tab.component.scss'
})
export class ProfileTabComponent implements OnInit {
  private http = inject(HttpClient);
  private httpUtil = inject(HttpUtilService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  authFacade = inject(AuthFacade);
  deviceFacade = inject(DeviceFacade);

  // User profile information
  userInfo = signal<any>(null);

  // UI state signals
  isLoading = signal(true);
  isLoadingDevices = signal(true);
  editMode = signal(false);
  changeEmailMode = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  private phoneValid = signal(false);
  private phoneVerified = signal(false);
  private sendingCode = signal(false);
  private verifying = signal(false);
  private showModal = signal(false);
  private statusMessage = signal('');
  private codeArray = signal(['', '', '', '', '', '']);

  // Getters pour les signals
  isPhoneValid = this.phoneValid.asReadonly();
  isPhoneVerified = this.phoneVerified.asReadonly();
  isSendingCode = this.sendingCode.asReadonly();
  isVerifying = this.verifying.asReadonly();
  showVerificationModal = this.showModal.asReadonly();
  phoneStatusMessage = this.statusMessage.asReadonly();
  verificationCode = this.codeArray.asReadonly();
  // Pour gérer les tentatives de chargement
  retryAttempts = 0;
  maxRetries = 3;

  // Forms
  profileForm!: FormGroup;
  emailForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
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


  /*requestEmailChange(): void {
    if (this.emailForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.emailForm.controls).forEach(key => {
        this.emailForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check if emails match
    if (this.emailForm.value.email !== this.emailForm.value.confirmEmail) {
      this.errorMessage.set('Les adresses email ne correspondent pas');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authFacade.(
      this.emailForm.value.email || '',
      this.emailForm.value.confirmEmail || ''
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        console.error('Failed to request email change', err);
        this.errorMessage.set(err.error?.message || 'Échec de la demande de changement d\'email');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe({
      next: (response) => {
        if (response !== null) {
          this.successMessage.set('Demande de changement d\'email envoyée. Veuillez vérifier votre adresse email actuelle pour confirmer la demande.');
          this.toggleChangeEmailMode();
        }
      }
    });
  } */

  formatDate(date: string): string {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  }

  // Si l'utilisateur veut forcer le rechargement des données
  retryLoading(): void {
    this.loadUserProfile();
  }

  /**
   * Validation du format international du téléphone
   */
  private validatePhoneFormat(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    return phoneRegex.test(phone?.trim() || '');
  }

  /**
   * Gestionnaire de changement du numéro de téléphone
   */
  onPhoneChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const phone = input.value;

    this.phoneValid.set(this.validatePhoneFormat(phone));
    this.phoneVerified.set(false); // Reset verification status
    this.statusMessage.set('');
  }

  /**
   * Envoi du code de vérification SMS
   */
  async sendVerificationCode(): Promise<void> {
    const phoneNumber = this.profileForm.get('phoneNumber')?.value;
    if (!this.phoneValid() || !phoneNumber) return;

    this.sendingCode.set(true);
    this.statusMessage.set('');

    this.httpUtil.post('/api/profile/SMS/request-verification', {
      phoneNumber
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        console.error('Erreur envoi SMS:', err);
        this.statusMessage.set('Erreur lors de l\'envoi du SMS. Veuillez réessayer.');
        return of(null);
      }),
      finalize(() => {
        this.sendingCode.set(false);
      })
    ).subscribe({
      next: (response) => {
        if (response !== null) {
          this.statusMessage.set('Code de vérification envoyé !');
          this.showModal.set(true);
          this.resetVerificationCode();
        }
      }
    });
  }

  /**
   * Gestionnaire d'input pour le code de vérification
   */
  onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Ne garder que les chiffres
    const numericValue = value.replace(/\D/g, '');
    input.value = numericValue;

    // Mettre à jour le tableau du code
    const currentCode = [...this.codeArray()];
    currentCode[index] = numericValue;
    this.codeArray.set(currentCode);

    // Auto-focus sur le champ suivant si une valeur est saisie
    if (numericValue && index < 5) {
      const nextInput = document.querySelector(`input.code-input:nth-child(${index + 2})`) as HTMLInputElement;
      nextInput?.focus();
    }
  }

  /**
   * Gestionnaire des touches pour navigation du code
   */
  onCodeKeyDown(index: number, event: KeyboardEvent): void {
    // Retour en arrière
    if (event.key === 'Backspace' && !this.codeArray()[index] && index > 0) {
      const prevInput = document.querySelector(`input.code-input:nth-child(${index})`) as HTMLInputElement;
      prevInput?.focus();
    }
  }

  /**
   * Vérifier si le code est complet
   */
  isCodeComplete(): boolean {
    return this.codeArray().every(digit => digit.length === 1);
  }

  /**
   * Vérification du code SMS
   */
  verifyCode(): void {
    if (!this.isCodeComplete()) return;

    this.verifying.set(true);
    const code = this.codeArray().join('');

    this.http.post('/api/profile/SMS/verify', {
      verificationCode: code
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        console.error('Erreur vérification:', err);
        this.statusMessage.set('Code incorrect. Veuillez réessayer.');
        this.resetVerificationCode();
        return of(null);
      }),
      finalize(() => {
        this.verifying.set(false);
      })
    ).subscribe({
      next: (response) => {
        if (response !== null) {
          this.phoneVerified.set(true);
          this.showModal.set(false);
          this.statusMessage.set('Numéro vérifié avec succès !');

          // Optionnel: mettre à jour le profil utilisateur
          this.loadUserProfile();
        }
      }
    });
  }

  /**
   * Fermer la modal de vérification
   */
  closeVerificationModal(): void {
    this.showModal.set(false);
    this.resetVerificationCode();
  }

  /**
   * Fermer la modal en cliquant sur l'overlay
   */
  closeModal(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeVerificationModal();
    }
  }

  /**
   * Reset du code de vérification
   */
  private resetVerificationCode(): void {
    this.codeArray.set(['', '', '', '', '', '']);
  }

}
