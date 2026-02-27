// src/app/features/admin/users/user-detail/components/tabs/user-devices-tab/user-devices-tab.component.ts

import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule }                                        from '@angular/common';
import { FormsModule }                                         from '@angular/forms';

import { Device }          from '../../../../../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../../../../../data/models/device/device-trust-level';
import { AdminDeviceApiService } from '../../../../../services/admin-device-api.service';

/**
 * "Devices" tab in the admin user detail view.
 *
 * Owns all local UI state for the device list:
 * - Async loading / error handling
 * - Text filter (browser, OS, IP)
 * - Column sort (lastSeen desc by default)
 * - Selected-device side panel
 *
 * Mutations available from the side panel:
 * - Change trust level
 * - Blacklist / unblacklist
 * - Disconnect (invalidate session)
 *
 * @example
 * ```html
 * <app-user-devices-tab [publicUserId]="user()!.publicId" />
 * ```
 */
@Component({
  selector:    'app-user-devices-tab',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './user-devices-tab.component.html',
  styleUrl:    './user-devices-tab.component.scss',
})
export class UserDevicesTabComponent implements OnInit {

  @Input({ required: true }) publicUserId!: string;

  // ---------------------------------------------------------------------------
  // Dependencies
  // ---------------------------------------------------------------------------

  private readonly deviceApi = inject(AdminDeviceApiService);

  // ---------------------------------------------------------------------------
  // State signals
  // ---------------------------------------------------------------------------

  readonly devices    = signal<Device[]>([]);
  readonly isLoading  = signal(true);
  readonly error      = signal<string | null>(null);
  readonly isMutating = signal(false);

  /** Currently selected device shown in the side panel. */
  readonly selectedDevice = signal<Device | null>(null);

  /** Text filter applied to browser, OS and IP columns. */
  readonly filterText = signal('');

  /** Active sort column. */
  readonly sortField = signal<keyof Device>('lastSeen');

  /** Sort direction. */
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  /** Filtered + sorted device list derived from raw devices signal. */
  readonly filteredDevices = computed(() => {
    const q = this.filterText().toLowerCase().trim();
    let list = this.devices();

    if (q) {
      list = list.filter(d =>
        d.browser?.toLowerCase().includes(q)        ||
        d.operatingSystem?.toLowerCase().includes(q)||
        d.lastIpAddress?.toLowerCase().includes(q)  ||
        d.deviceType?.toLowerCase().includes(q)
      );
    }

    const field = this.sortField();
    const dir   = this.sortDir() === 'asc' ? 1 : -1;

    return [...list].sort((a, b) => {
      const va = (a as any)[field] ?? '';
      const vb = (b as any)[field] ?? '';
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    this.loadDevices();
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  loadDevices(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.deviceApi.getUserDevices(this.publicUserId).subscribe({
      next:  d  => { this.devices.set(d); this.isLoading.set(false); },
      error: () => { this.error.set('Impossible de charger les appareils.'); this.isLoading.set(false); },
    });
  }

  // ---------------------------------------------------------------------------
  // Table interactions
  // ---------------------------------------------------------------------------

  /**
   * Sets the sort field; toggles direction when the same field is clicked again.
   */
  setSort(field: keyof Device): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
  }

  selectDevice(device: Device): void {
    this.selectedDevice.set(device);
  }

  closePanel(): void {
    this.selectedDevice.set(null);
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  blacklist(device: Device): void {
    this.isMutating.set(true);
    this.deviceApi.blacklistDevice(device.publicId).subscribe({
      next: () => { this._patchDevice(device.publicId, { blacklisted: true }); this.isMutating.set(false); },
      error: () => this.isMutating.set(false),
    });
  }

  unblacklist(device: Device): void {
    this.isMutating.set(true);
    this.deviceApi.removeFromBlacklist(device.publicId).subscribe({
      next: () => { this._patchDevice(device.publicId, { blacklisted: false }); this.isMutating.set(false); },
      error: () => this.isMutating.set(false),
    });
  }

  disconnect(device: Device): void {
    this.isMutating.set(true);
    this.deviceApi.disconnectDevice(device.publicId).subscribe({
      next: () => { this._patchDevice(device.publicId, { loggedOut: true }); this.isMutating.set(false); },
      error: () => this.isMutating.set(false),
    });
  }

  setTrustLevel(device: Device, level: DeviceTrustLevel): void {
    this.isMutating.set(true);
    this.deviceApi.updateDeviceTrustLevel(device.publicId, level).subscribe({
      next: () => { this._patchDevice(device.publicId, { level }); this.isMutating.set(false); },
      error: () => this.isMutating.set(false),
    });
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  /** Expose enum to template. */
  protected readonly DeviceTrustLevel = DeviceTrustLevel;

  /** All trust level values for the select in the side panel. */
  readonly trustLevels = Object.values(DeviceTrustLevel);

  readonly trustLevelLabels: Record<DeviceTrustLevel, string> = {
    [DeviceTrustLevel.UNTRUSTED]:     'Non approuvé',
    [DeviceTrustLevel.BASIC]:         'Basique',
    [DeviceTrustLevel.TRUSTED]:       'Approuvé',
    [DeviceTrustLevel.HIGHLY_TRUSTED]:'Haute confiance',
  };

  readonly trustLevelClass: Record<DeviceTrustLevel, string> = {
    [DeviceTrustLevel.UNTRUSTED]:     'trust--untrusted',
    [DeviceTrustLevel.BASIC]:         'trust--basic',
    [DeviceTrustLevel.TRUSTED]:       'trust--trusted',
    [DeviceTrustLevel.HIGHLY_TRUSTED]:'trust--highly-trusted',
  };

  /**
   * Returns a simple icon character representing the device type.
   * Purely cosmetic — no accessibility impact (aria-hidden in template).
   */
  deviceTypeIcon(type: string): string {
    const t = type?.toUpperCase() ?? '';
    if (t.includes('MOBILE'))  return '📱';
    if (t.includes('TABLET'))  return '📟';
    if (t.includes('LAPTOP'))  return '💻';
    if (t.includes('DESKTOP')) return '🖥️';
    if (t.includes('TV'))      return '📺';
    return '🔌';
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Patches a single device in the `devices` signal without a full reload.
   * Also refreshes the selected device signal if it points to the same record.
   */
  private _patchDevice(publicId: string, patch: Partial<Device>): void {
    this.devices.update(list =>
      list.map(d => d.publicId === publicId ? { ...d, ...patch } : d)
    );
    const sel = this.selectedDevice();
    if (sel?.publicId === publicId) {
      this.selectedDevice.set({ ...sel, ...patch });
    }
  }
}
