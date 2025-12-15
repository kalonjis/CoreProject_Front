// src/app/features/account/pages/two-factor/index.ts

/**
 * Two-Factor Authentication Pages Module
 *
 * Public API for the 2FA configuration pages.
 * Dedicated pages for each 2FA method configuration.
 */

// Overview page
export { TwoFactorOverviewComponent } from './two-factor-overview/two-factor-overview.component';

// Method configuration pages
export { EmailTwoFactorComponent } from './email-two-factor/email-two-factor.component';
export { TotpTwoFactorComponent } from './totp-two-factor/totp-two-factor.component';

// Setup modals (specific to pages)
export { TotpSetupModalComponent } from './totp-two-factor/components/totp-setup-modal/totp-setup-modal.component';

// Routes
export { TWO_FACTOR_ROUTES } from './two-factor.routes';
