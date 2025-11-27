import { DeviceSession } from './device-session.model';

/**
 * Device state managed by DeviceStore.
 * Represents the current device context of the authenticated user.
 *
 * Note: Auth state is managed separately by AuthStore (SoC).
 */
export interface DeviceState {
  /** Current device session, null if not loaded or not authenticated */
  currentDevice: DeviceSession | null;

  /** True during async operations (fetch, update) */
  isLoading: boolean;

  /** Last error message, null if no error */
  error: string | null;
}

/**
 * Initial state used when creating the DeviceStore.
 */
export const initialDeviceState: DeviceState = {
  currentDevice: null,
  isLoading: false,
  error: null
};
