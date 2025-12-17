// src/app/core/auth/state/two-factor.store.ts

import { Injectable, signal, computed } from '@angular/core';
import { TwoFactorMethod, TwoFactorType } from '../models/two-factor.model';

/**
 * TwoFactorStore - State for 2FA login flow.
 *
 * Manages:
 * - Available methods cache (avoid re-fetch on back navigation)
 * - Current verification context (for page refresh robustness)
 *
 * Lifecycle:
 * - Populated when entering 2FA flow
 * - Cleared after successful verification or session expiry
 */
@Injectable({ providedIn: 'root' })
export class TwoFactorStore {

  // ===========================================================================
  // PRIVATE STATE
  // ===========================================================================

  /** Cached available methods */
  private readonly _availableMethods = signal<TwoFactorMethod[] | null>(null);
  private readonly _isLoadingMethods = signal(false);

  /** Current verification context (set after choose-method) */
  private readonly _verificationContext = signal<VerificationContext | null>(null);

  // ===========================================================================
  // PUBLIC READONLY STATE
  // ===========================================================================

  readonly availableMethods = this._availableMethods.asReadonly();
  readonly isLoadingMethods = this._isLoadingMethods.asReadonly();
  readonly verificationContext = this._verificationContext.asReadonly();

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  readonly hasLoadedMethods = computed(() => this._availableMethods() !== null);
  readonly isInVerificationPhase = computed(() => this._verificationContext() !== null);
  readonly currentType = computed(() => this._verificationContext()?.type ?? null);

  // ===========================================================================
  // MUTATIONS - METHODS
  // ===========================================================================

  setAvailableMethods(methods: TwoFactorMethod[]): void {
    this._availableMethods.set(methods);
  }

  setLoadingMethods(loading: boolean): void {
    this._isLoadingMethods.set(loading);
  }

  // ===========================================================================
  // MUTATIONS - VERIFICATION CONTEXT
  // ===========================================================================

  setVerificationContext(context: VerificationContext): void {
    this._verificationContext.set(context);
  }

  clearVerificationContext(): void {
    this._verificationContext.set(null);
  }

  // ===========================================================================
  // CLEAR
  // ===========================================================================

  /**
   * Clear all state.
   * Called after successful login or session expiry.
   */
  clearAll(): void {
    this._availableMethods.set(null);
    this._isLoadingMethods.set(false);
    this._verificationContext.set(null);
  }
}

// ===========================================================================
// TYPES
// ===========================================================================

export interface VerificationContext {
  type: TwoFactorType;
  maskedDestination?: string;
}
