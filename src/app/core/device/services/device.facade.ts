// src/app/core/device/services/device.facade.ts

import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, throwError, finalize, switchMap, of } from 'rxjs';

import { DeviceStore } from '../state/device.store';
import { DeviceApiService, DeviceOperationResponse } from './device-api.service';
import { DeviceSession } from '../models/device-session.model';
import { Device } from '../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';

/**
 * DeviceFacade - Single entry point for device operations.
 *
 * Responsibilities:
 * - Orchestrate device flows (load, disconnect, update trust level)
 * - Coordinate DeviceStore and DeviceApiService
 * - Handle side effects (loading state, errors)
 * - Expose reactive state for components
 *
 * Components should ONLY interact with this facade, never directly
 * with DeviceStore or DeviceApiService.
 */
@Injectable({ providedIn: 'root' })
export class DeviceFacade {

  // Dependencies
  private readonly deviceStore = inject(DeviceStore);
  private readonly deviceApi = inject(DeviceApiService);

  // ===========================================================================
  // EXPOSED STATE (readonly)
  // ===========================================================================

  /** Current device session */
  readonly currentDevice = this.deviceStore.currentDevice;

  /** List of user's devices */
  readonly devices = this.deviceStore.devices;

  /** True during async operations */
  readonly isLoading = this.deviceStore.isLoading;

  /** Last error message */
  readonly error = this.deviceStore.error;

  /** Current device public ID */
  readonly devicePublicId = this.deviceStore.devicePublicId;

  /** True if current device is confirmed */
  readonly isConfirmed = this.deviceStore.isConfirmed;

  /** True if current device is blacklisted */
  readonly isBlacklisted = this.deviceStore.isBlacklisted;

  /** Current device trust level */
  readonly trustLevel = this.deviceStore.trustLevel;

  // ===========================================================================
  // SESSION MANAGEMENT
  // ===========================================================================

  /**
   * Load current device session from server.
   * Updates store with device data.
   */
  loadSession(): void {
    this.deviceStore.setLoading(true);

    this.deviceApi.getSession().pipe(
      tap(device => this.deviceStore.setDevice(device)),
      catchError(err => {
        this.deviceStore.setError('Failed to load device session');
        return throwError(() => err);
      }),
      finalize(() => this.deviceStore.setLoading(false))
    ).subscribe();
  }

  /**
   * Reload current device session from server.
   * Returns Observable for chaining.
   */
  reloadSession(): Observable<DeviceSession> {
    this.deviceStore.setLoading(true);

    return this.deviceApi.getSession().pipe(
      tap(device => this.deviceStore.setDevice(device)),
      catchError(err => {
        this.deviceStore.setError('Failed to reload device session');
        return throwError(() => err);
      }),
      finalize(() => this.deviceStore.setLoading(false))
    );
  }

  /**
   * Clear device state.
   * Used on logout or session expiry.
   */
  clearSession(): void {
    this.deviceStore.reset();
  }

  // ===========================================================================
  // DEVICE LIST
  // ===========================================================================

  /**
   * Load all devices for current user into store.
   */
  loadDevices(): void {
    this.deviceStore.setLoading(true);

    this.deviceApi.getMyDevices().pipe(
      tap(devices => this.deviceStore.setDevices(devices)),
      catchError(err => {
        this.deviceStore.setError('Failed to load devices');
        return throwError(() => err);
      }),
      finalize(() => this.deviceStore.setLoading(false))
    ).subscribe();
  }

  /**
   * Reload all devices and return Observable for chaining.
   */
  reloadDevices(): Observable<Device[]> {
    this.deviceStore.setLoading(true);

    return this.deviceApi.getMyDevices().pipe(
      tap(devices => this.deviceStore.setDevices(devices)),
      catchError(err => {
        this.deviceStore.setError('Failed to reload devices');
        return throwError(() => err);
      }),
      finalize(() => this.deviceStore.setLoading(false))
    );
  }

  /**
   * Get current device full info.
   */
  getCurrentDevice(): Observable<Device> {
    return this.deviceApi.getCurrent();
  }

  /**
   * Get specific device by ID.
   */
  getDevice(publicId: string): Observable<Device> {
    return this.deviceApi.getDevice(publicId);
  }

  // ===========================================================================
  // DEVICE CONFIRMATION
  // ===========================================================================

  /**
   * Confirm device with token (from email link).
   */
  confirmDevice(token: string): Observable<DeviceOperationResponse> {
    return this.deviceApi.confirmDevice(token).pipe(
      tap(() => this.loadSession())
    );
  }

  /**
   * Reject device with token (from email link).
   */
  rejectDevice(token: string): Observable<DeviceOperationResponse> {
    return this.deviceApi.rejectDevice(token);
  }

  /**
   * Request new confirmation link for current device.
   */
  requestConfirmationLink(): Observable<DeviceOperationResponse> {
    return this.deviceApi.requestConfirmationLink();
  }

  // ===========================================================================
  // DEVICE MANAGEMENT
  // ===========================================================================

  /**
   * Update device trust level.
   * Reloads device list after success.
   */
  updateTrustLevel(publicId: string, level: DeviceTrustLevel): Observable<DeviceOperationResponse> {
    return this.deviceApi.updateTrustLevel(publicId, level).pipe(
      tap(() => {
        // Reload devices to get updated state
        this.loadDevices();
        // If it's the current device, reload session too
        const current = this.deviceStore.currentDevice();
        if (current && current.publicId === publicId) {
          this.loadSession();
        }
      })
    );
  }

  /**
   * Disconnect a specific device.
   * Removes device from store list.
   */
  disconnectDevice(publicId: string): Observable<DeviceOperationResponse> {
    return this.deviceApi.disconnectDevice(publicId).pipe(
      tap(() => this.deviceStore.removeDeviceFromList(publicId))
    );
  }

  /**
   * Disconnect all devices except current.
   * Reloads device list after success.
   */
  disconnectAllOthers(): Observable<DeviceOperationResponse> {
    return this.deviceApi.disconnectAllOthers().pipe(
      tap(() => this.loadDevices())
    );
  }

  // ===========================================================================
  // TRUST LEVEL HELPERS
  // ===========================================================================

  /**
   * Check if current device has at least the specified trust level.
   */
  hasTrustLevel = this.deviceStore.hasTrustLevel.bind(this.deviceStore);
}
