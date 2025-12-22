import { DeviceSession } from './device-session.model';
import {Device} from '../../../data/models/device/device';

/**
 * Device state managed by DeviceStore.
 * Represents the current device context of the authenticated user.
 *
 * Note: Auth state is managed separately by AuthStore (SoC).
 */
export interface DeviceState {

  /** Current device session, null if not loaded or not authenticated */
  currentDevice: DeviceSession | null;

  /** List of user's devices */
  devices: Device[];

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
  devices: [],
  isLoading: false,
  error: null
};
