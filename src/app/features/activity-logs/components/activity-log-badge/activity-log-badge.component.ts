// src/app/features/activity-logs/components/activity-log-badge/activity-log-badge.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  ActivityLogCategory,
  ACTIVITY_LOG_CATEGORY_LABELS,
  ACTIVITY_LOG_CATEGORY_COLORS,
} from '../../models/activity-log-category.enum';

/**
 * Displays a colored badge for an activity log category.
 *
 * Usage:
 * ```html
 * <app-activity-log-badge [category]="log.actionCategory" />
 * <app-activity-log-badge [category]="log.actionCategory" size="sm" />
 * ```
 */
@Component({
    selector: 'app-activity-log-badge',
    imports: [CommonModule],
    templateUrl: './activity-log-badge.component.html',
    styleUrl: './activity-log-badge.component.scss'
})
export class ActivityLogBadgeComponent {

  @Input({ required: true }) category!: ActivityLogCategory | string;
  @Input() size: 'sm' | 'md' = 'md';

  get label(): string {
    return ACTIVITY_LOG_CATEGORY_LABELS[this.category as ActivityLogCategory]
      ?? this.category;
  }

  get colorClass(): string {
    const color = ACTIVITY_LOG_CATEGORY_COLORS[this.category as ActivityLogCategory] ?? 'gray';
    return `badge--${color}`;
  }
}
