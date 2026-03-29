// src/app/features/activity-logs/components/activity-log-table/activity-log-table.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActivityLogBadgeComponent } from '../activity-log-badge/activity-log-badge.component';
import { ActivityLog } from '../../models/activity-log.model';

/**
 * Presentational table component for activity logs.
 *
 * Purely dumb — receives data via @Input, emits user interactions via @Output.
 * Never injects a facade or service directly.
 *
 * Usage:
 * ```html
 * <app-activity-log-table
 *   [logs]="facade.logs()"
 *   [loading]="facade.loading()"
 *   [currentPage]="facade.currentPage()"
 *   [totalPages]="facade.totalPages()"
 *   [totalElements]="facade.totalElements()"
 *   (logSelected)="facade.selectLog($event)"
 *   (pageChange)="facade.goToPage($event)"
 * />
 * ```
 */
@Component({
    selector: 'app-activity-log-table',
    imports: [CommonModule, ActivityLogBadgeComponent],
    templateUrl: './activity-log-table.component.html',
    styleUrl: './activity-log-table.component.scss'
})
export class ActivityLogTableComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  @Input({ required: true }) logs: ActivityLog[] = [];
  @Input() loading       = false;
  @Input() currentPage   = 0;
  @Input() totalPages    = 0;
  @Input() totalElements = 0;
  @Input() selectedLog: ActivityLog | null = null;
  /** Whether to show the actor (user) column. Set to false on user-scoped views. */
  @Input() showActor = true;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  @Output() logSelected  = new EventEmitter<ActivityLog>();
  @Output() pageChange   = new EventEmitter<number>();

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-BE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  isSelected(log: ActivityLog): boolean {
    return this.selectedLog?.publicId === log.publicId;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get hasPrev(): boolean { return this.currentPage > 0; }
  get hasNext(): boolean { return this.currentPage < this.totalPages - 1; }
}
