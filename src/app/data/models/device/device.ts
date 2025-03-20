import {DeviceTrustLevel} from './device-trust-level';

export interface Device {
  id: number;
  deviceType: string;
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  osVersion: string;
  device_cpu: string;
  device_cpu_bits: string;
  language: string;
  deviceClass: string;
  deviceBrand: string;
  fingerprint: string;
  firstSeen: string; // ISO date string
  lastSeen: string;  // ISO date string
  lastIpAddress: string;
  level: DeviceTrustLevel;
  confirmed: boolean;
  blacklisted: boolean;
}
