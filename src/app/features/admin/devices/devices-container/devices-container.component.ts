import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminStatsApiService } from '../../users/services/admin-stats-api.service';
import { DeviceStats } from '../../models/device-stats.model';

/**
 * Devices management container component.
 *
 * Serves as the landing page for the device management module.
 * Displays:
 * - Comprehensive device statistics overview
 * - Quick action buttons for common tasks
 * - Navigation to detailed device management pages
 *
 * This is the main entry point after clicking "Device Management" on the dashboard.
 */
@Component({
  selector: 'app-devices-container',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './devices-container.component.html',
  styleUrl: './devices-container.component.scss'
})
export class DevicesContainerComponent implements OnInit {
  private statsApi = inject(AdminStatsApiService);

  // Device statistics
  deviceStats = signal<DeviceStats | null>(null);

  // UI state
  isLoading = signal(true);
  error = signal<string | null>(null);
  lastUpdate = signal<Date | null>(null);

  // =========================================================================
  // COMPUTED PERCENTAGES
  // =========================================================================

  trustedDevicesPercent = computed(() => {
    const stats = this.deviceStats();
    if (!stats || stats.totalDevices === 0) return 0;
    return Math.round((stats.trustedDevices / stats.totalDevices) * 100);
  });

  untrustedDevicesPercent = computed(() => {
    const stats = this.deviceStats();
    if (!stats || stats.totalDevices === 0) return 0;
    return Math.round((stats.untrustedDevices / stats.totalDevices) * 100);
  });

  activeDevicesPercent = computed(() => {
    const stats = this.deviceStats();
    if (!stats || stats.totalDevices === 0) return 0;
    return Math.round((stats.activeDevices / stats.totalDevices) * 100);
  });

  inactiveDevicesPercent = computed(() => {
    const stats = this.deviceStats();
    if (!stats || stats.totalDevices === 0) return 0;
    return Math.round((stats.inactiveDevices / stats.totalDevices) * 100);
  });

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    this.loadStats();
  }

  // =========================================================================
  // METHODS
  // =========================================================================

  /**
   * Loads device statistics from the API.
   */
  loadStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.statsApi.getDeviceStats().subscribe({
      next: (stats) => {
        this.deviceStats.set(stats);
        this.lastUpdate.set(new Date());
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading device stats', err);
        this.error.set('Unable to load device statistics');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Refreshes device statistics manually.
   */
  refreshStats(): void {
    this.loadStats();
  }

  /**
   * Returns a human-readable "time ago" string for last update.
   */
  getLastUpdateText(): string {
    const lastUpdate = this.lastUpdate();
    if (!lastUpdate) return '';

    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return lastUpdate.toLocaleDateString('en-US');
  }
}
