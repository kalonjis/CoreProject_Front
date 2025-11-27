import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';

/**
 * Lightweight device model for session context.
 * Contains only the fields needed by the device store for current session management.
 * For full device data (device list, admin), use the Device model from data/models/device/.
 *
 * Maps to: GET /api/device/session → DeviceSessionResponse
 */
export interface DeviceSession {
  publicId: string;
  confirmed: boolean;
  level: DeviceTrustLevel;
  blacklisted: boolean;
}
