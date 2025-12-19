// src/app/features/account/components/security-tab/security-tab.component.ts

import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Router } from '@angular/router';

import { AuthFacade } from '../../../../core/auth/services/auth.facade';
import { TwoFactorApiService } from '../../../../core/auth/services/two-factor-api.service';
import { TwoFactorMethod } from '../../../../core/auth/models/two-factor.model';

interface SecuritySection {
  id: 'twofactor' | 'password' | 'recovery';
  title: string;
  description: string;
  icon: string;
  status: string;
  enabled: boolean;
}

interface ConnectedProvider {
  name: string;
  icon: string;
}

@Component({
  selector: 'app-security-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security-tab.component.html',
  styleUrl: './security-tab.component.scss'
})
export class SecurityTabComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly authFacade = inject(AuthFacade);
  private readonly twoFactorApi = inject(TwoFactorApiService);
  private readonly router = inject(Router);

  // Navigation state
  selectedSection = signal<'overview' | 'twofactor' | 'password' | 'recovery'>('overview');

  // 2FA state
  twoFactorMethods = signal<TwoFactorMethod[]>([]);
  twoFactorLoading = signal(true);

  // Connected providers (TODO: fetch from API)
  connectedProviders = signal<ConnectedProvider[]>([]);

  // =========================================================================
  // COMPUTED - Password
  // =========================================================================

  /** True if user has a password defined */
  hasPassword = computed(() => this.authFacade.hasPassword());

  /** Password status text for overview card */
  passwordStatus = computed(() => {
    if (this.hasPassword()) {
      return 'Password set';
    }
    return 'No password (OAuth account)';
  });

  /** Last password change date formatted */
  passwordLastChanged = computed(() => {
    const user = this.authFacade.user();
    if (user?.passwordChangedAt) {
      const date = new Date(user.passwordChangedAt);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return 'Unknown';
  });

  // =========================================================================
  // COMPUTED - 2FA
  // =========================================================================

  enabledMethodsCount = computed(() =>
    this.twoFactorMethods().filter(m => m.isEnabled && m.type !== 'BACKUP_CODES').length
  );

  twoFactorStatus = computed(() => {
    if (this.twoFactorLoading()) {
      return 'Loading...';
    }
    const count = this.enabledMethodsCount();
    if (count === 0) {
      return 'Not configured';
    }
    return `${count} method${count > 1 ? 's' : ''} active`;
  });

  // =========================================================================
  // COMPUTED - Recovery
  // =========================================================================

  recoveryStatus = computed(() => {
    if (this.twoFactorLoading()) {
      return 'Loading...';
    }
    const hasBackupCodes = this.twoFactorMethods()
      .some(m => m.isEnabled && m.type === 'BACKUP_CODES');
    return hasBackupCodes ? 'Configured' : 'Not configured';
  });

  // =========================================================================
  // COMPUTED - Security Sections
  // =========================================================================

  securitySections = computed<SecuritySection[]>(() => [
    {
      id: 'twofactor',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: '🛡️',
      status: this.twoFactorStatus(),
      enabled: true
    },
    {
      id: 'password',
      title: 'Password',
      description: this.hasPassword()
        ? 'Change your account password'
        : 'Set a password to login with email',
      icon: '🔑',
      status: this.passwordStatus(),
      enabled: true
    },
    {
      id: 'recovery',
      title: 'Recovery Options',
      description: 'Backup codes and account recovery',
      icon: '🔐',
      status: this.recoveryStatus(),
      enabled: true
    }
  ]);

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    this.loadTwoFactorStatus();
    this.loadConnectedProviders();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load 2FA methods status.
   */
  loadTwoFactorStatus(): void {
    this.twoFactorLoading.set(true);

    this.twoFactorApi.getSettings().pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        console.error('Failed to load 2FA methods:', err);
        return of([]);
      })
    ).subscribe(methods => {
      this.twoFactorMethods.set(methods);
      this.twoFactorLoading.set(false);
    });
  }

  /**
   * Load connected OAuth providers.
   * TODO: Implement API call to fetch connected providers
   */
  loadConnectedProviders(): void {
    // Placeholder - replace with actual API call
    // this.oauthApi.getConnectedProviders().subscribe(...)

    // For now, check if user has no password (likely OAuth)
    if (!this.hasPassword()) {
      // Default to showing Google as connected
      // This should be replaced with actual data from backend
      this.connectedProviders.set([
        { name: 'Google', icon: '🔵' }
      ]);
    }
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  /**
   * Select a security section.
   */
  selectSection(sectionId: 'twofactor' | 'password' | 'recovery'): void {
    const section = this.securitySections().find(s => s.id === sectionId);
    if (!section?.enabled) {
      return;
    }

    if (sectionId === 'twofactor') {
      this.router.navigate(['/account/security/two-factor']);
      return;
    }

    if (sectionId === 'recovery') {
      this.router.navigate(['/account/security/recovery']);
      return;
    }

    // Password section shows inline
    this.selectedSection.set(sectionId);
  }

  /**
   * Navigate to password change or define page.
   */
  navigateToPassword(): void {
    if (this.hasPassword()) {
      this.router.navigate(['/password/change']);
    } else {
      this.router.navigate(['/password/define']);
    }
  }

  /**
   * Navigate back to security overview.
   */
  showOverview(): void {
    this.selectedSection.set('overview');
    this.loadTwoFactorStatus();
  }

  /**
   * Get section configuration by ID.
   */
  getSectionById(sectionId: string): SecuritySection | undefined {
    return this.securitySections().find(section => section.id === sectionId);
  }
}
