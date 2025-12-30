import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminStatsApiService } from '../../services/admin-stats-api.service';
import { UserStats } from '../../models/user-stats.model';

/**
 * Users management container component.
 *
 * Serves as the landing page for the user management module.
 * Displays:
 * - Comprehensive user statistics overview
 * - Quick action buttons for common tasks
 * - Navigation to detailed user management pages
 *
 * This is the main entry point after clicking "User Management" on the dashboard.
 */
@Component({
  selector: 'app-users-container',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './users-container.component.html',
  styleUrl: './users-container.component.scss'
})
export class UsersContainerComponent implements OnInit {
  private statsApi = inject(AdminStatsApiService);

  // User statistics
  userStats = signal<UserStats | null>(null);

  // UI state
  isLoading = signal(true);
  error = signal<string | null>(null);
  lastUpdate = signal<Date | null>(null);

  // =========================================================================
  // COMPUTED PERCENTAGES
  // =========================================================================

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
   * Loads user statistics from the API.
   */
  loadStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.statsApi.getUserStats().subscribe({
      next: (stats) => {
        console.log("stat : " + stats)
        this.userStats.set(stats);
        this.lastUpdate.set(new Date());
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading user stats', err);
        this.error.set('Unable to load user statistics');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Refreshes user statistics manually.
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
