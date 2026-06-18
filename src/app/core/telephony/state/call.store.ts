import { Injectable, computed, signal } from '@angular/core';
import { CallProvider } from '../models/call-session.model';

/** Registration state of the SIP user agent. */
export type SipStatus = 'UNREGISTERED' | 'REGISTERING' | 'REGISTERED';

/** Registration state of the Twilio Voice Device. */
export type TwilioStatus = 'UNREGISTERED' | 'REGISTERING' | 'REGISTERED';

/** Phase within an active call. INCOMING = inbound invite not yet answered. */
export type CallPhase = 'INCOMING' | 'RINGING' | 'ACTIVE';

/** Snapshot of an active call kept in client-side state. */
export interface ActiveCallState {
  sessionPublicId: string;
  phoneNumber: string;
  /** Display name of the contact or lead (e.g. "Jean Dupont"). Shown in the widget. */
  displayName?: string;
  /** ISO timestamp when the call was initiated. */
  startedAt: string;
  contactPublicId: string | null;
  leadPublicId: string | null;
  /** Determines which UI and termination path to use. */
  provider: CallProvider;
  /** Granular phase for SIP calls. TEL_URI always stays ACTIVE. */
  phase: CallPhase;
  direction?: 'INBOUND' | 'OUTBOUND';
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

  private readonly _activeCall   = signal<ActiveCallState | null>(null);
  private readonly _isInitiating = signal(false);
  private readonly _isTerminating = signal(false);
  private readonly _isMuted      = signal(false);
  private readonly _sipStatus    = signal<SipStatus>('UNREGISTERED');
  private readonly _twilioStatus = signal<TwilioStatus>('UNREGISTERED');
  private readonly _sipHasConfig = signal(false);

  // =========================================================================
  // Selectors
  // =========================================================================

  readonly activeCall    = this._activeCall.asReadonly();
  readonly isInitiating  = this._isInitiating.asReadonly();
  readonly isTerminating = this._isTerminating.asReadonly();
  readonly isMuted       = this._isMuted.asReadonly();
  readonly sipStatus     = this._sipStatus.asReadonly();
  readonly twilioStatus  = this._twilioStatus.asReadonly();
  readonly sipHasConfig  = this._sipHasConfig.asReadonly();

  readonly isCallActive   = computed(() => this._activeCall() !== null);
  readonly isSipReady     = computed(() => this._sipStatus() === 'REGISTERED');
  readonly isTwilioReady  = computed(() => this._twilioStatus() === 'REGISTERED');
  readonly isRinging      = computed(() => this._activeCall()?.phase === 'RINGING');
  readonly isIncoming     = computed(() => this._activeCall()?.phase === 'INCOMING');

  // =========================================================================
  // Mutations
  // =========================================================================

  setInitiating(value: boolean): void   { this._isInitiating.set(value); }
  setTerminating(value: boolean): void  { this._isTerminating.set(value); }
  setMuted(value: boolean): void        { this._isMuted.set(value); }
  setSipStatus(s: SipStatus): void          { this._sipStatus.set(s); }
  setTwilioStatus(s: TwilioStatus): void    { this._twilioStatus.set(s); }
  setSipHasConfig(value: boolean): void     { this._sipHasConfig.set(value); }

  setActiveCall(state: ActiveCallState): void {
    this._activeCall.set(state);
    this._isInitiating.set(false);
    this._isMuted.set(false);
  }

  setCallPhase(phase: CallPhase): void {
    const call = this._activeCall();
    if (!call) return;
    if (call.phase === 'ACTIVE' && phase === 'RINGING') return;
    this._activeCall.set({ ...call, phase });
  }

  clearActiveCall(): void {
    this._activeCall.set(null);
    this._isTerminating.set(false);
    this._isMuted.set(false);
  }
}
