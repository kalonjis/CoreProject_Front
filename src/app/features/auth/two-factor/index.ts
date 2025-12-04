// src/app/features/auth/two-factor/index.ts

/**
 * Two-Factor Authentication Feature
 *
 * Public API for the 2FA login flow feature.
 * Components in this feature handle the 2FA verification during login.
 */

// Container (smart component)
export { TwoFactorContainerComponent } from './two-factor-container/two-factor-container.component';

// Presentational components
export { MethodSelectorComponent } from './components/method-selector/method-selector.component';
export { VerifyCodeComponent } from './components/verify-code/verify-code.component';
