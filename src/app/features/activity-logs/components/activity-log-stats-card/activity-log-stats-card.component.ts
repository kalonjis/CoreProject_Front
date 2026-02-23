// src/app/features/activity-logs/components/activity-log-stats-card/activity-log-stats-card.component.ts

import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActivityLogBadgeComponent } from '../activity-log-badge/activity-log-badge.component';
import { ActivityLogStats } from '../../models/activity-log.model';
import {
  ActivityLogCategory,
  ACTIVITY_LOG_CATEGORY_LABELS,
  TOP_LEVEL_CATEGORIES,
} from '../../models/activity-log-category.enum';

/**
 * Stats card — shows log counts grouped by category.
 *
 * Purely presentational.
 *
 * Usage:
 * ```html
 * <app-activity-log-stats-card
 *   [stats]="facade.stats()"
 *   [loading]="facade.statsLoading()" />
 * ```
 */
@Component({
  selector: 'app-activity-log-stats-card',
  standalone: true,
  imports: [CommonModule, ActivityLogBadgeComponent],
  templateUrl: './activity-log-stats-card.component.html',
  styleUrl: './activity-log-stats-card.component.scss'
})
export class ActivityLogStatsCardComponent {

  @Input() set stats(value: ActivityLogStats | null) {
    this._stats.set(value);
  }
  @Input() loading = false;

  private readonly _stats = signal<ActivityLogStats | null>(null);

  /** Rows to display — only top-level categories that have a count */
  readonly rows = computed(() => {
    const stats = this._stats();
    if (!stats) return [];

    return TOP_LEVEL_CATEGORIES
      .map(cat => ({
        category: cat,
        label:    ACTIVITY_LOG_CATEGORY_LABELS[cat],
        count:    stats.countsByCategory[cat] ?? 0,
        percent:  stats.total > 0
          ? Math.round(((stats.countsByCategory[cat] ?? 0) / stats.total) * 100)
          : 0,
      }))
      .filter(row => row.count > 0);
  });

  readonly total = computed(() => this._stats()?.total ?? 0);
}
