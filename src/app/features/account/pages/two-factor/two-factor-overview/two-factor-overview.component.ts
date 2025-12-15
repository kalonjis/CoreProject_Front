// src/app/features/account/pages/two-factor/two-factor-overview/two-factor-overview.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';

import { AuthFacade } from '../../../../../core/auth/services/auth.facade';
import { TwoFactorMethod, TwoFactorType } from '../../../../../core/auth/models/two-factor.model';

/**
 * Two-Factor Overview Component.
 *
 * Displays list of all 2FA methods with their status.
 * Navigates to dedicated pages for each method configuration.
 *
 * Route: /account/security/two-factor
 */
@Component({
  selector: 'app-two-factor-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './two-factor-overview.component.html',
  styleUrl: './two-factor-overview.component.scss'
})
export class TwoFactorOverviewComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  // State
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
   * Navigate to method configuration page.
   */
  navigateToMethod(method: TwoFactorMethod): void {
    const routes: Record<TwoFactorType, string> = {
      EMAIL: 'email',
      SMS: 'sms',
      TOTP: 'totp',
      BACKUP_CODES: 'backup-codes',
      WEBAUTHN: 'webauthn'
    };

    const route = routes[method.type];
    if (route) {
      this.router.navigate(['/account/security/two-factor', route]);
    }
  }

  /**
   * Navigate back to security overview.
   */
  goBack(): void {
    this.router.navigate(['/account/security']);
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
   * Get enabled methods count.
   */
  getEnabledMethodsCount(): number {
    return this.twoFactorMethods().filter(m => m.isEnabled).length;
  }

  /**
   * Retry loading.
   */
  retryLoading(): void {
    this.loadTwoFactorMethods();
  }
}
