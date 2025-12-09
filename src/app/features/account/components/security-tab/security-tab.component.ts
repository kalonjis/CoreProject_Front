// src/app/features/account/components/security-tab/security-tab.component.ts

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
export class SecurityTabComponent {

  // Navigation state
  selectedSection = signal<'overview' | 'twofactor' | 'password' | 'recovery'>('overview');

  // Password state (mock for now)
  lastPasswordChange = signal<Date | null>(new Date('2024-12-05'));

  // Security sections configuration
  securitySections = [
    {
      id: 'twofactor' as const,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: '🔐',
      status: '2 methods active', // This would be dynamic
      enabled: true
    },
    {
      id: 'password' as const,
      title: 'Password',
      description: 'Manage your account password',
      icon: '🔑',
      status: 'Last changed: Dec 5, 2024',
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
  ];

  /**
   * Navigate to a specific security section.
   */
  selectSection(sectionId: 'twofactor' | 'password' | 'recovery'): void {
    if (sectionId === 'recovery') {
      // Recovery not implemented yet
      return;
    }
    this.selectedSection.set(sectionId);
  }

  /**
   * Navigate back to security overview.
   */
  showOverview(): void {
    this.selectedSection.set('overview');
  }

  /**
   * Navigate to password change page.
   */
  changePassword(): void {
    // This will use the existing password change functionality
    window.location.href = '/password/change';
  }

  /**
   * Get section configuration by ID.
   */
  getSectionById(sectionId: string) {
    return this.securitySections.find(section => section.id === sectionId);
  }
}
