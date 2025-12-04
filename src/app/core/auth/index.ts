// src/app/core/auth/index.ts

// =============================================================================
// MODELS - Auth
// =============================================================================

export type { UserSession } from './models/user-session.model';
export type { AuthState } from './models/auth.state';
export type { LoginRequest } from './models/login-request.model';
export type { AuthOperationResponse, AuthStatusResponse } from './models/auth-response.model';

export { initialAuthState } from './models/auth.state';

// =============================================================================
// MODELS - Two-Factor
// =============================================================================

export type {
  TwoFactorType,
  TwoFactorFlowState,
  TwoFactorTypeConfig,
  TwoFactorMethod,
  TwoFactorOperationResponse,
  TwoFactorStatusResponse,
  TwoFactorVerifyRequest,
  TwoFactorMethodChosenResponse,
  ChooseTwoFactorMethodRequest,
  TotpSetupResponse,
  BackupCodesSetupResponse,
} from './models/two-factor.model';

export {
  TWO_FACTOR_CONFIG,
  getTwoFactorConfig,
  canResendCode,
  formatBackupCode,
  buildVerifyRequest,
} from './models/two-factor.model';

// =============================================================================
// STATE
// =============================================================================

export { AuthStore } from './state/auth.store';

// =============================================================================
// SERVICES
// =============================================================================

export { AuthApiService } from './services/auth-api.service';
export { AuthFacade } from './services/auth.facade';
export { AuthSyncService } from './services/auth-sync.service';
export { TwoFactorApiService } from './services/two-factor-api.service';

// =============================================================================
// GUARDS
// =============================================================================

export { authGuard } from './guards/auth.guard';

// =============================================================================
// CONFIG
// =============================================================================

export {
  isPublicApiRoute,
  isPublicFrontendRoute,
  PUBLIC_API_ROUTES,
  PUBLIC_FRONTEND_ROUTES,
} from './config/public-routes.config';
