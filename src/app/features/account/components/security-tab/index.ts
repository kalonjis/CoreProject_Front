// src/app/features/account/components/security-tab/index.ts

/**
 * Security Tab Feature Module
 *
 * Public API for the security tab components.
 * Handles 2FA management, password settings, and recovery options.
 */

// Main security tab component
export { SecurityTabComponent } from './security-tab.component';

// Two-Factor Authentication section components
export { TwoFactorSectionComponent } from './components/two-factor-section/two-factor-section.component';
export { MethodsOverviewComponent } from './components/two-factor-section/components/methods-overview/methods-overview.component';

// Two-Factor Authentication method detail components
export { TotpDetailComponent } from './components/two-factor-section/components/totp-detail/totp-detail.component';
