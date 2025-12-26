/**
 * Device statistics model for admin dashboard and device management.
 * Contains aggregated metrics about registered devices.
 */
export interface DeviceStats {
  /** Total number of devices in the system */
  totalDevices: number;

  /** Number of trusted devices (TRUSTED + HIGHLY_TRUSTED) */
  trustedDevices: number;

  /** Number of untrusted devices (UNTRUSTED + BASIC) */
  untrustedDevices: number;

  /** Number of devices with UNTRUSTED trust level only */
  untrustedOnly: number;

  /** Number of devices with BASIC trust level only */
  basicOnly: number;

  /** Number of devices with TRUSTED trust level only */
  trustedOnly: number;

  /** Number of devices with HIGHLY_TRUSTED trust level only */
  highlyTrustedOnly: number;

  /** Number of devices active in the last 30 days */
  activeDevices: number;

  /** Number of devices inactive for 30+ days */
  inactiveDevices: number;

  /** Timestamp when stats were generated (ISO 8601 format) */
  timestamp?: string;
}
