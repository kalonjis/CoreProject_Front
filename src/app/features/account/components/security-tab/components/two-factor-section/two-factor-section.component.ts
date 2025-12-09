// src/app/features/account/components/security-tab/components/two-factor-section/two-factor-section.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';

import { TwoFactorApiService } from '../../../../../../core/auth/services/two-factor-api.service';
import {
  TwoFactorType,
  TwoFactorMethod
} from '../../../../../../core/auth/models/two-factor.model';
import { MethodsOverviewComponent } from './components/methods-overview/methods-overview.component';

/**
 * Two-Factor Authentication section container.
 *
 * Manages 2FA methods state and navigation between overview and detail views.
 *
 * Views:
 * - overview: List of all 2FA methods with status
 * - detail: Detailed configuration for selected method
 */
@Component({
  selector: 'app-two-factor-section',
  standalone: true,
  imports: [CommonModule, MethodsOverviewComponent],
  templateUrl: './two-factor-section.component.html',
  styleUrl: './two-factor-section.component.scss'
})
export class TwoFactorSectionComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private twoFactorApi = inject(TwoFactorApiService);

  // Navigation state
  currentView = signal<'overview' | 'detail'>('overview');
  selectedMethod = signal<TwoFactorMethod | null>(null);

  // Two-Factor Authentication state
  twoFactorMethods = signal<TwoFactorMethod[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Available 2FA methods configuration
  availableTypes: TwoFactorType[] = ['EMAIL', 'SMS', 'TOTP', 'BACKUP_CODES'];

  ngOnInit(): void {
    this.loadTwoFactorMethods();
  }

  /**
   * Load user's two-factor authentication methods.
   */
  private loadTwoFactorMethods(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Note: Using mock data for development, replace with real API call
    this.loadMockTwoFactorData();

    // TODO: Replace with real API call when settings endpoint is ready
    // this.twoFactorApi.getUserTwoFactorMethods()
    //   .pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     catchError(err => {
    //       console.error('Failed to load 2FA methods', err);
    //       this.errorMessage.set('Failed to load two-factor authentication settings');
    //       return of([]);
    //     }),
    //     finalize(() => this.isLoading.set(false))
    //   )
    //   .subscribe(methods => this.twoFactorMethods.set(methods));
  }

  /**
   * Mock data for development - replace with real API call.
   */
  private loadMockTwoFactorData(): void {
    // Simulate API call delay
    setTimeout(() => {
      const mockMethods: TwoFactorMethod[] = this.availableTypes.map(type => ({
        userPublicId: 'user-123',
        type,
        displayName: this.getMethodDisplayName(type),
        description: this.getMethodDescription(type),
        isPrimary: type === 'EMAIL',
        isEnabled: type === 'EMAIL' || type === 'TOTP' // Mock: EMAIL and TOTP enabled
      }));

      this.twoFactorMethods.set(mockMethods);
      this.isLoading.set(false);
    }, 600);
  }

  /**
   * Get display name for 2FA method type.
   */
  getMethodDisplayName(type: TwoFactorType): string {
    const names: Record<TwoFactorType, string> = {
      EMAIL: 'Email Verification',
      SMS: 'SMS Messages',
      TOTP: 'Authenticator App',
      BACKUP_CODES: 'Backup Codes',
      WEBAUTHN: 'Security Key'
    };
    return names[type];
  }

  /**
   * Get description for 2FA method type.
   */
  getMethodDescription(type: TwoFactorType): string {
    const descriptions: Record<TwoFactorType, string> = {
      EMAIL: 'Receive verification codes via email',
      SMS: 'Receive verification codes via SMS to +32 484 42 83 73',
      TOTP: 'Use Google Authenticator or similar apps',
      BACKUP_CODES: 'One-time use backup codes for recovery',
      WEBAUTHN: 'Hardware security keys and biometrics'
    };
    return descriptions[type];
  }

  /**
   * Get icon for 2FA method type.
   */
  getMethodIcon(type: TwoFactorType): string {
    const icons: Record<TwoFactorType, string> = {
      EMAIL: '📧',
      SMS: '📱',
      TOTP: '🔐',
      BACKUP_CODES: '🗝️',
      WEBAUTHN: '🔑'
    };
    return icons[type];
  }

  /**
   * Get enabled 2FA methods count.
   */
  getEnabledMethodsCount(): number {
    return this.twoFactorMethods().filter(method => method.isEnabled).length;
  }

  /**
   * Navigate to method detail view.
   */
  showMethodDetail(method: TwoFactorMethod): void {
    this.selectedMethod.set(method);
    this.currentView.set('detail');
  }

  /**
   * Navigate back to overview.
   */
  showOverview(): void {
    this.currentView.set('overview');
    this.selectedMethod.set(null);
  }

  /**
   * Handle enabling a 2FA method.
   */
  enableMethod(method: TwoFactorMethod): void {
    console.log('Enable method:', method.type);
    // TODO: Implement enable logic
    this.showMethodDetail(method);
  }

  /**
   * Handle disabling a 2FA method.
   */
  disableMethod(method: TwoFactorMethod): void {
    console.log('Disable method:', method.type);
    // TODO: Implement disable logic with confirmation
  }

  /**
   * Retry loading 2FA settings.
   */
  retryLoading(): void {
    this.loadTwoFactorMethods();
  }
}
