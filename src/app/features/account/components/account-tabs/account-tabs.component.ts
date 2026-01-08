// src/app/features/account/components/account-tabs/account-tabs.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Account tabs navigation component.
 *
 * Provides tab navigation for different account sections:
 * - Profile: Personal information, contact details
 * - Security: 2FA, password, session management
 * - Devices: Device management and trust levels
 */
@Component({
  selector: 'app-account-tabs',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './account-tabs.component.html',
  styleUrl: './account-tabs.component.scss'
})
export class AccountTabsComponent {

  /**
   * Account navigation tabs configuration.
   */
  tabs = [
    {
      label: 'Profile',
      route: '/account/profile',
      icon: '👤',
      description: 'Personal information and contact details'
    },
    {
      label: 'Security',
      route: '/account/security',
      icon: '🔒',
      description: 'Two-factor authentication and security settings'
    },
    {
      label: 'Devices',
      route: '/account/device',
      icon: '📱',
      description: 'Manage your devices and sessions'
    }
  ];
}
