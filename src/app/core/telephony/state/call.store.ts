import { Injectable, computed, signal } from '@angular/core';

/** Snapshot of an active call kept in client-side state. */
export interface ActiveCallState {
  sessionPublicId: string;
  phoneNumber: string;
  /** ISO timestamp when the call was initiated (used to compute elapsed time). */
  startedAt: string;
  /** Public ID of the contact being called, if any. */
  contactPublicId: string | null;
  /** Public ID of the lead being called, if any. */
  leadPublicId: string | null;
}

/**
 * Signal-based store for the active call lifecycle.
 *
 * At most one call session can be active per user (enforced server-side too).
 * Provided at root so the call widget and the phone-link component share state.
 */
@Injectable({ providedIn: 'root' })
export class CallStore {

  // =========================================================================
  // State
  // =========================================================================

  private readonly _activeCall  = signal<ActiveCallState | null>(null);
  private readonly _isInitiating = signal(false);
  private readonly _isTerminating = signal(false);

  // =========================================================================
  // Selectors
  // =========================================================================

  readonly activeCall    = this._activeCall.asReadonly();
  readonly isInitiating  = this._isInitiating.asReadonly();
  readonly isTerminating = this._isTerminating.asReadonly();

  /** True when a call session exists. */
  readonly isCallActive = computed(() => this._activeCall() !== null);

  // =========================================================================
  // Mutations
  // =========================================================================

  setInitiating(value: boolean): void {
    this._isInitiating.set(value);
  }

  setTerminating(value: boolean): void {
    this._isTerminating.set(value);
  }

  setActiveCall(state: ActiveCallState): void {
    this._activeCall.set(state);
    this._isInitiating.set(false);
  }

  clearActiveCall(): void {
    this._activeCall.set(null);
    this._isTerminating.set(false);
  }
}
