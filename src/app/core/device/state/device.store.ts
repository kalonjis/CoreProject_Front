import {computed, Injectable, signal} from '@angular/core';
import {DeviceState, initialDeviceState} from '../models/device.state';
import {DeviceSession} from '../models/device-session.model';
import {DeviceTrustLevel} from '../../../data/models/device/device-trust-level';

/**
 * DeviceStore - Signal-based state management for current device.
 *
 * Responsibilities:
 * - Hold current device state (signals)
 * - Provide computed values (derived state)
 * - Expose mutations to modify state
 *
 * Does NOT handle:
 * - HTTP calls (see DeviceApiService)
 * - Side effects (see AuthFacade for orchestration)
 */
@Injectable({ providedIn: 'root' })
export class DeviceStore {

  // =========================================================================
  // STATE (private)
  // =========================================================================

  private readonly _state = signal<DeviceState>(initialDeviceState);

  // =========================================================================
  // SELECTORS (public readonly)
  // =========================================================================

  /** Full state (readonly) */
  readonly state = this._state.asReadonly();

  /** Current device session */
  readonly currentDevice = computed(() => this._state().currentDevice);

  /** True during async operations */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Last error message */
  readonly error = computed(() => this._state().error);

  // =========================================================================
  // DERIVED SELECTORS (convenience)
  // =========================================================================

  /** Current device public ID */
  readonly devicePublicId = computed(() => this._state().currentDevice?.publicId ?? null);

  /** True if current device is confirmed */
  readonly isConfirmed = computed(() => this._state().currentDevice?.confirmed ?? false);

  /** True if current device is blacklisted */
  readonly isBlacklisted = computed(() => this._state().currentDevice?.blacklisted ?? false);

  /** Current device trust level */
  readonly trustLevel = computed(() => this._state().currentDevice?.level ?? null);

  // =========================================================================
  // TRUST LEVEL CHECKERS
  // =========================================================================

  /** Check if device meets minimum trust level */
  hasTrustLevel(requiredLevel: DeviceTrustLevel): boolean {
    const currentLevel = this.trustLevel();
    if (!currentLevel) return false;

    const levels: DeviceTrustLevel[] = [
      DeviceTrustLevel.UNTRUSTED,
      DeviceTrustLevel.BASIC,
      DeviceTrustLevel.TRUSTED,
      DeviceTrustLevel.HIGHLY_TRUSTED
    ];

    const currentIndex = levels.indexOf(currentLevel);
    const requiredIndex = levels.indexOf(requiredLevel);

    return currentIndex >= requiredIndex;
  }

  /** True if device is trusted or higher */
  readonly isTrusted = computed(() =>
    this.hasTrustLevel(DeviceTrustLevel.TRUSTED)
  );

  /** True if device is highly trusted */
  readonly isHighlyTrusted = computed(() =>
    this.hasTrustLevel(DeviceTrustLevel.HIGHLY_TRUSTED)
  );

  // =========================================================================
  // MUTATIONS
  // =========================================================================

  /** Set current device after fetch */
  setDevice(device: DeviceSession): void {
    this._state.update(state => ({
      ...state,
      currentDevice: device,
      isLoading: false,
      error: null
    }));
  }

  /** Update device confirmation status */
  setConfirmed(confirmed: boolean): void {
    this._state.update(state => ({
      ...state,
      currentDevice: state.currentDevice
        ? { ...state.currentDevice, confirmed }
        : null
    }));
  }

  /** Set loading state */
  setLoading(isLoading: boolean): void {
    this._state.update(state => ({ ...state, isLoading }));
  }

  /** Set error state */
  setError(error: string): void {
    this._state.update(state => ({
      ...state,
      error,
      isLoading: false
    }));
  }

  /** Clear error */
  clearError(): void {
    this._state.update(state => ({ ...state, error: null }));
  }

  /** Reset to initial state (logout) */
  reset(): void {
    this._state.set(initialDeviceState);
  }
}
