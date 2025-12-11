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
import { TotpDetailComponent } from './components/totp-detail/totp-detail.component';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';

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
  imports: [CommonModule, MethodsOverviewComponent, TotpDetailComponent],
  templateUrl: './two-factor-section.component.html',
  styleUrl: './two-factor-section.component.scss'
})
export class TwoFactorSectionComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authFacade = inject(AuthFacade);
  private confirmDialogService = inject(ConfirmDialogService);

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
   * For TOTP, this is handled by the TotpDetailComponent itself.
   * For other methods, we handle the enable logic here.
   */
  enableMethod(method: TwoFactorMethod): void {
    if (method.type === 'TOTP') {
      // TOTP enable is handled by TotpDetailComponent
      this.showMethodDetail(method);
      return;
    }

    // For other methods, show confirmation and enable
    this.confirmDialogService.confirm({
      title: `Enable ${method.displayName}`,
      message: `Are you sure you want to enable ${method.displayName}?`,
      confirmButtonText: 'Enable',
      type: 'info'
    }).then(() => {
      this.performEnableMethod(method);
    }).catch(() => {
      // User cancelled
      console.log('Enable cancelled by user');
    });
  }

  /**
   * Handle disabling a 2FA method.
   */
  disableMethod(method: TwoFactorMethod): void {
    // Check if this is the last enabled method
    const enabledCount = this.getEnabledMethodsCount();
    if (method.isPrimary && enabledCount === 1) {
      this.errorMessage.set('Cannot disable your only 2FA method. Enable another method first.');
      return;
    }

    this.confirmDialogService.confirm({
      title: `Disable ${method.displayName}`,
      message: `Are you sure you want to disable ${method.displayName}? This will reduce your account security.`,
      confirmButtonText: 'Disable',
      type: 'danger'
    }).then(() => {
      this.performDisableMethod(method);
    }).catch(() => {
      // User cancelled
      console.log('Disable cancelled by user');
    });
  }

  /**
   * Perform the actual enable method API call.
   */
  private performEnableMethod(method: TwoFactorMethod): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authFacade.enableTwoFactorMethod(method.type)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to enable method', err);
          this.errorMessage.set(`Failed to enable ${method.displayName}. Please try again.`);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(response => {
        if (response) {
          this.loadTwoFactorMethods(); // Reload to get updated status
        }
      });
  }

  /**
   * Perform the actual disable method API call.
   */
  private performDisableMethod(method: TwoFactorMethod): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authFacade.disableTwoFactorMethod(method.type)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to disable method', err);
          this.errorMessage.set(`Failed to disable ${method.displayName}. Please try again.`);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(response => {
        if (response) {
          this.loadTwoFactorMethods(); // Reload to get updated status
          this.showOverview(); // Return to overview after disable
        }
      });
  }

  /**
   * Handle method updated event from detail components.
   * Reloads the methods list to reflect changes.
   */
  onMethodUpdated(): void {
    this.loadTwoFactorMethods();
  }

  /**
   * Handle enable request from detail components.
   */
  onEnableRequested(method: TwoFactorMethod): void {
    this.enableMethod(method);
  }

  /**
   * Handle disable request from detail components.
   */
  onDisableRequested(method: TwoFactorMethod): void {
    this.disableMethod(method);
  }

  /**
   * Retry loading 2FA settings.
   */
  retryLoading(): void {
    this.loadTwoFactorMethods();
  }
}
