// src/app/features/account/components/security-tab/security-tab.component.ts

import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { AuthFacade } from '../../../../core/auth/services/auth.facade';
import { TwoFactorApiService } from '../../../../core/auth/services/two-factor-api.service';
import { TwoFactorMethod } from '../../../../core/auth/models/two-factor.model';

/**
 * Security tab component for account management.
 *
 * Container component that orchestrates security-related sections:
 * - Overview: Shows clickable cards for each security section
 * - Two-Factor Authentication: Detailed 2FA management
 * - Password: Password management
 * - Recovery Options: Account recovery (future)
 */
@Component({
    selector: 'app-security',
    imports: [CommonModule],
    templateUrl: './security.component.html',
    styleUrl: './security.component.scss'
})
export class SecurityComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authFacade = inject(AuthFacade);
  private twoFactorApi = inject(TwoFactorApiService);
  private router = inject(Router);

  // Navigation state
  selectedSection = signal<'overview' | 'twofactor' | 'password' | 'recovery'>('overview');

  // 2FA state
  twoFactorMethods = signal<TwoFactorMethod[]>([]);
  twoFactorLoading = signal(true);

  // Computed: count enabled 2FA methods
  enabledMethodsCount = computed(() =>
    this.twoFactorMethods().filter(m => m.isEnabled && m.type !== "BACKUP_CODES").length
  );

  // Computed: 2FA status text
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

  // Computed: 2FA section enabled
  twoFactorEnabled = computed(() => !this.twoFactorLoading());


  // Computed: 2FA status text
  recoveryStatus = computed(() => {
    if (this.twoFactorLoading()) {
      return 'Loading...';
    }
    const count = this.twoFactorMethods().filter(m =>  m.isEnabled && m.type === "BACKUP_CODES").length;
    if (count === 0) {
      return 'Not configured';
    }
    return `${count} method${count > 1 ? 's' : ''} active`;
  });

  hasPassword = computed(() => this.authFacade.hasPassword());

  // Password status (from user session)
  passwordStatus = computed(() => {
    if  (!this.hasPassword()){
      return 'Not configured';
    }
    const user = this.authFacade.user();

    if (user?.passwordChangedAt) {
      const date = new Date(user.passwordChangedAt);
      return `Last changed: ${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}`;
    }
    return 'Configured';
  });

  // Computed: password button text
  passwordButtonText = computed(() => {
    return this.hasPassword() ? 'Change Password' : 'Define Password';
  });

  // Security sections configuration (computed for dynamic status)
  securitySections = computed(() => [
    {
      id: 'twofactor' as const,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: '🔐',
      status: this.twoFactorStatus(),
      enabled: this.twoFactorEnabled()
    },
    {
      id: 'password' as const,
      title: 'Password',
      description: 'Manage your account password',
      icon: '🔑',
      status: this.passwordStatus(),
      enabled: true
    },
    {
      id: 'recovery' as const,
      title: 'Recovery Options',
      description: 'Account recovery methods',
      icon: '🆘',
      status: this.recoveryStatus(),
      enabled: true
    }
  ]);

  ngOnInit(): void {
    this.loadTwoFactorStatus();
  }

  /**
   * Load 2FA methods to display status in overview.
   */
  private loadTwoFactorStatus(): void {
    this.twoFactorLoading.set(true);

    this.twoFactorApi.getSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to load 2FA status', err);
          return of([]);
        })
      )
      .subscribe((methods: TwoFactorMethod[]) => {
        this.twoFactorMethods.set(methods);
        this.twoFactorLoading.set(false);
      });
  }

  /**
   * Navigate to a specific security section.
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

    this.selectedSection.set(sectionId);
  }

  /**
   * Navigate back to security overview.
   */
  showOverview(): void {
    this.selectedSection.set('overview');
    this.loadTwoFactorStatus();
  }

  /**
   * Navigate to the appropriated password page.
   */
  changePassword(): void {
    if (this.hasPassword()) {
      window.location.href = '/password/change';
    } else {
      window.location.href = '/password/define';
    }
  }

  /**
   * Get section configuration by ID.
   */
  getSectionById(sectionId: string) {
    return this.securitySections().find(section => section.id === sectionId);
  }
}
