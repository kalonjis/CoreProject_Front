import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

/**
 * Interface pour les statistiques utilisateurs
 */
interface UserStats {
  totalUsers: number;
  activeUsers: number;
  deactivatedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  adminUsers: number;
  regularUsers: number;
  timestamp?: string;
}

/**
 * Interface pour les statistiques devices
 */
interface DeviceStats {
  totalDevices: number;
  trustedDevices: number;        // TRUSTED + HIGHLY_TRUSTED
  untrustedDevices: number;      // UNTRUSTED + BASIC
  untrustedOnly: number;
  basicOnly: number;
  trustedOnly: number;
  highlyTrustedOnly: number;
  activeDevices: number;
  inactiveDevices: number;
  timestamp?: string;
}

/**
 * Admin dashboard component displaying comprehensive system statistics.
 *
 * Provides at-a-glance overview of:
 * - User accounts (status, verification, roles)
 * - Device trust levels and activity
 *
 * Stats are loaded in parallel for optimal performance.
 * Uses signals for reactive state management.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);

  // User statistics
  userStats = signal<UserStats | null>(null);

  // Device statistics
  deviceStats = signal<DeviceStats | null>(null);

  // UI state
  isLoading = signal(true);
  error = signal<string | null>(null);
  lastUpdate = signal<Date | null>(null);

  // Computed percentages for users
  activeUsersPercent = computed(() => {
    const stats = this.userStats();
    if (!stats || stats.totalUsers === 0) return 0;
    return Math.round((stats.activeUsers / stats.totalUsers) * 100);
  });

  deactivatedUsersPercent = computed(() => {
    const stats = this.userStats();
    if (!stats || stats.totalUsers === 0) return 0;
    return Math.round((stats.deactivatedUsers / stats.totalUsers) * 100);
  });

  verifiedUsersPercent = computed(() => {
    const stats = this.userStats();
    if (!stats || stats.totalUsers === 0) return 0;
    return Math.round((stats.verifiedUsers / stats.totalUsers) * 100);
  });

  unverifiedUsersPercent = computed(() => {
    const stats = this.userStats();
    if (!stats || stats.totalUsers === 0) return 0;
    return Math.round((stats.unverifiedUsers / stats.totalUsers) * 100);
  });

  // Computed percentages for devices
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

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  /**
   * Loads all dashboard statistics in parallel.
   * Uses forkJoin to make concurrent API calls for better performance.
   */
  loadDashboardStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load user and device stats in parallel
    forkJoin({
      userStats: this.http.get<UserStats>('/api/admin/users/stats'),
      deviceStats: this.http.get<DeviceStats>('/api/admin/device/stats')
    }).subscribe({
      next: ({ userStats, deviceStats }) => {
        // Update user statistics
        this.userStats.set(userStats);

        // Update device statistics
        this.deviceStats.set(deviceStats);

        // Update timestamp
        this.lastUpdate.set(new Date());

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
        this.error.set('Impossible de charger les statistiques du tableau de bord');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Refreshes dashboard statistics manually.
   * Can be triggered by a refresh button in the template.
   */
  refreshStats(): void {
    this.loadDashboardStats();
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

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins === 1) return 'Il y a 1 minute';
    if (diffMins < 60) return `Il y a ${diffMins} minutes`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Il y a 1 heure';
    if (diffHours < 24) return `Il y a ${diffHours} heures`;

    return lastUpdate.toLocaleDateString('fr-FR');
  }
}
