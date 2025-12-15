// src/app/features/account/pages/recovery/recovery-overview/recovery-overview.component.ts

import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';

import { AuthFacade } from '../../../../../core/auth/services/auth.facade';
import { TwoFactorMethod, TwoFactorType } from '../../../../../core/auth/models/two-factor.model';

/**
 * Recovery Overview Component.
 *
 * Displays list of all recovery options with their status.
 * Navigates to dedicated pages for each recovery method configuration.
 *
 * Recovery Methods:
 * - Backup Codes: Single-use recovery codes
 * - Future: Recovery email, recovery phone
 *
 * Route: /account/security/recovery
 */
@Component({
  selector: 'app-recovery-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recovery-overview.component.html',
  styleUrl: './recovery-overview.component.scss'
})
export class RecoveryOverviewComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  // State
  twoFactorMethods = signal<TwoFactorMethod[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Recovery options configuration
  readonly recoveryOptions = [
    {
      type: 'BACKUP_CODES' as TwoFactorType,
      name: 'Backup Codes',
      description: 'Single-use codes for emergency account access',
      icon: '🗝️',
      route: 'backup-codes',
      available: true
    },
    {
      type: 'RECOVERY_EMAIL' as any,
      name: 'Recovery Email',
      description: 'Alternative email address for account recovery',
      icon: '📧',
      route: 'recovery-email',
      available: false
    },
    {
      type: 'RECOVERY_PHONE' as any,
      name: 'Recovery Phone',
      description: 'Alternative phone number for account recovery',
      icon: '📱',
      route: 'recovery-phone',
      available: false
    }
  ];

  ngOnInit(): void {
    this.loadRecoveryMethods();
  }

  /**
   * Load recovery methods status.
   */
  private loadRecoveryMethods(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authFacade.loadTwoFactorSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to load recovery methods', err);
          this.errorMessage.set('Failed to load recovery options');
          return of([]);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(methods => this.twoFactorMethods.set(methods));
  }

  /**
   * Navigate to recovery method configuration page.
   */
  navigateToMethod(option: typeof this.recoveryOptions[0]): void {
    if (!option.available) {
      return; // Coming soon methods
    }
    this.router.navigate(['/account/security/recovery', option.route]);
  }

  /**
   * Get method status by type.
   */
  getMethodStatus(type: string): TwoFactorMethod | null {
    return this.twoFactorMethods().find(m => m.type === type) || null;
  }

  /**
   * Check if user has primary 2FA enabled.
   */
  hasPrimary2FA(): boolean {
    return this.twoFactorMethods().some(m =>
      m.isEnabled && m.type !== 'BACKUP_CODES'
    );
  }

  /**
   * Get enabled primary 2FA methods count.
   */
  getPrimary2FACount(): number {
    return this.twoFactorMethods().filter(m =>
      m.isEnabled && m.type !== 'BACKUP_CODES'
    ).length;
  }

  /**
   * Get enabled recovery methods count.
   */
  getEnabledRecoveryCount(): number {
    const backupCodes = this.getMethodStatus('BACKUP_CODES');
    return backupCodes?.isEnabled ? 1 : 0;
  }

  /**
   * Navigate back to security overview.
   */
  goBack(): void {
    this.router.navigate(['/account/security']);
  }

  /**
   * Retry loading.
   */
  retryLoading(): void {
    this.loadRecoveryMethods();
  }
}
