// src/app/features/account/components/security-tab/components/two-factor-section/two-factor-section.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';

import { AuthFacade } from '../../../../../../core/auth/services/auth.facade';
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
  private authFacade = inject(AuthFacade);

  // Navigation state
  currentView = signal<'overview' | 'detail'>('overview');
  selectedMethod = signal<TwoFactorMethod | null>(null);

  // Two-Factor Authentication state
  twoFactorMethods = signal<TwoFactorMethod[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadTwoFactorMethods();
  }

  /**
   * Load user's two-factor authentication methods.
   */
  private loadTwoFactorMethods(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authFacade.loadTwoFactorSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to load 2FA methods', err);
          this.errorMessage.set('Failed to load two-factor authentication settings');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(methods => this.twoFactorMethods.set(methods));
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
    // TODO: Implement enable logic with modal
    this.showMethodDetail(method);
  }

  /**
   * Handle disabling a 2FA method.
   */
  disableMethod(method: TwoFactorMethod): void {
    console.log('Disable method:', method.type);
    // TODO: Implement disable logic with confirmation modal
  }

  /**
   * Retry loading 2FA settings.
   */
  retryLoading(): void {
    this.loadTwoFactorMethods();
  }
}
