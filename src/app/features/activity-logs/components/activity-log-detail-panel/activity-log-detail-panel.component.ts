// src/app/features/activity-logs/components/activity-log-detail-panel/activity-log-detail-panel.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActivityLogBadgeComponent } from '../activity-log-badge/activity-log-badge.component';
import { ActivityLog } from '../../models/activity-log.model';

/**
 * Side panel showing the full details of a selected activity log entry.
 *
 * Purely presentational — receives the selected log via @Input,
 * emits close via @Output.
 *
 * Usage:
 * ```html
 * @if (facade.selected()) {
 *   <app-activity-log-detail-panel
 *     [log]="facade.selected()!"
 *     (closed)="facade.clearSelection()" />
 * }
 * ```
 */
@Component({
  selector: 'app-activity-log-detail-panel',
  standalone: true,
  imports: [CommonModule, ActivityLogBadgeComponent],
  templateUrl: './activity-log-detail-panel.component.html',
  styleUrl: './activity-log-detail-panel.component.scss'
})
export class ActivityLogDetailPanelComponent {

  @Input({ required: true }) log!: ActivityLog;
  @Output() closed = new EventEmitter<void>();

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-BE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
