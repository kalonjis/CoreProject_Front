// src/app/features/account/components/security-tab/security-tab.component.ts

import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { AuthFacade } from '../../../../core/auth/services/auth.facade';
import { TwoFactorMethod } from '../../../../core/auth/models/two-factor.model';
import { TwoFactorSectionComponent } from './components/two-factor-section/two-factor-section.component';

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
  selector: 'app-security-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, TwoFactorSectionComponent],
  templateUrl: './security-tab.component.html',
  styleUrl: './security-tab.component.scss'
})
export class SecurityTabComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authFacade = inject(AuthFacade);

  // Navigation state
  selectedSection = signal<'overview' | 'twofactor' | 'password' | 'recovery'>('overview');

  // 2FA state
  twoFactorMethods = signal<TwoFactorMethod[]>([]);
  twoFactorLoading = signal(true);

  // Computed: count enabled 2FA methods
  enabledMethodsCount = computed(() =>
    this.twoFactorMethods().filter(m => m.isEnabled).length
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

  // Password status (from user session)
  passwordStatus = computed(() => {
    const user = this.authFacade.user();
    if (user?.passwordChangedAt) {
      const date = new Date(user.passwordChangedAt);
      return `Last changed: ${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}`; // → "Last changed: Dec 5, 2024, 3:45 PM"
    }
    return 'Configured';
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
      status: this.passwordStatus(),  // ← dynamique
      enabled: true
    },
    {
      id: 'recovery' as const,
      title: 'Recovery Options',
      description: 'Account recovery methods',
      icon: '🆘',
      status: 'Coming Soon',
      enabled: false
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

    this.authFacade.loadTwoFactorSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error('Failed to load 2FA status', err);
          return of([]);
        })
      )
      .subscribe(methods => {
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
    this.selectedSection.set(sectionId);
  }

  /**
   * Navigate back to security overview.
   */
  showOverview(): void {
    this.selectedSection.set('overview');
    // Refresh 2FA status when returning to overview
    this.loadTwoFactorStatus();
  }

  /**
   * Navigate to password change page.
   */
  changePassword(): void {
    window.location.href = '/password/change';
  }

  /**
   * Get section configuration by ID.
   */
  getSectionById(sectionId: string) {
    return this.securitySections().find(section => section.id === sectionId);
  }
}
