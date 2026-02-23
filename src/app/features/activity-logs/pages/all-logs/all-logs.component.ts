// src/app/features/activity-logs/pages/all-logs/all-logs.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActivityLogAdminFacade } from '../../services/activity-log-admin.facade';
import { ActivityLogTableComponent } from '../../components/activity-log-table/activity-log-table.component';
import { ActivityLogFiltersComponent } from '../../components/activity-log-filters/activity-log-filters.component';
import { ActivityLogStatsCardComponent } from '../../components/activity-log-stats-card/activity-log-stats-card.component';
import { ActivityLogDetailPanelComponent } from '../../components/activity-log-detail-panel/activity-log-detail-panel.component';
import { ActivityLogFilter } from '../../models/activity-log.model';

/**
 * Admin page — all logs across all users.
 *
 * Smart component: injects the facade, wires inputs/outputs to child components.
 * Layout: stats card (top) + filters + table + detail panel (side).
 */
@Component({
  selector: 'app-all-logs',
  standalone: true,
  imports: [
    CommonModule,
    ActivityLogTableComponent,
    ActivityLogFiltersComponent,
    ActivityLogStatsCardComponent,
    ActivityLogDetailPanelComponent,
  ],
  templateUrl: './all-logs.component.html',
  styleUrl: './all-logs.component.scss'
})
export class AllLogsComponent implements OnInit {

  protected readonly facade = inject(ActivityLogAdminFacade);

  ngOnInit(): void {
    this.facade.loadLogs();
    this.facade.loadStats();
  }

  onFilterChange(filter: ActivityLogFilter): void {
    this.facade.applyFilter(filter);
    this.facade.loadStats(filter.from, filter.to);
  }

  onFilterReset(): void {
    this.facade.resetFilter();
    this.facade.loadStats();
  }
}
