// src/app/features/activity-logs/pages/user-logs/user-logs.component.ts

import { Component, OnInit, OnChanges, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { ActivityLogAdminFacade } from '../../services/activity-log-admin.facade';
import { ActivityLogTableComponent } from '../../components/activity-log-table/activity-log-table.component';
import { ActivityLogFiltersComponent } from '../../components/activity-log-filters/activity-log-filters.component';
import { ActivityLogDetailPanelComponent } from '../../components/activity-log-detail-panel/activity-log-detail-panel.component';
import { ActivityLogFilter } from '../../models/activity-log.model';

/**
 * Logs page scoped to a specific user.
 *
 * Works in two modes:
 *  - Standalone route  → publicUserId resolved from route params
 *  - Embedded          → publicUserId passed via @Input (e.g. user-detail tab)
 *
 * @Input takes priority over route params when both are present.
 */
@Component({
    selector: 'app-user-logs',
    imports: [
        CommonModule,
        ActivityLogTableComponent,
        ActivityLogFiltersComponent,
        ActivityLogDetailPanelComponent,
    ],
    templateUrl: './user-logs.component.html',
    styleUrl: './user-logs.component.scss'
})
export class UserLogsComponent implements OnInit, OnChanges {

  @Input() publicUserId?: string;

  protected readonly facade = inject(ActivityLogAdminFacade);
  private readonly route    = inject(ActivatedRoute);

  ngOnInit(): void {
    // If not provided via @Input, read from route params
    if (!this.publicUserId) {
      this.route.params.subscribe(params => {
        if (params['publicUserId']) {
          this.publicUserId = params['publicUserId'];
          this._load();
        }
      });
    } else {
      this._load();
    }
  }

  // Reload when @Input changes (e.g. navigating between users in user-detail)
  ngOnChanges(): void {
    if (this.publicUserId) {
      this._load();
    }
  }

  onFilterChange(filter: ActivityLogFilter): void {
    if (this.publicUserId) {
      this.facade.applyFilter(filter);
    }
  }

  onFilterReset(): void {
    if (this.publicUserId) {
      this.facade.resetFilter();
    }
  }

  private _load(): void {
    if (this.publicUserId) {
      this.facade.loadUserLogs(this.publicUserId);
    }
  }
}
