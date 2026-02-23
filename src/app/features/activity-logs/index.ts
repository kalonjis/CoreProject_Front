// src/app/features/activity-logs/index.ts
// Public API of the activity-logs feature.
// Import only from here — never from internal paths directly.

// ── Routes ────────────────────────────────────────────────────────────────────
export { ACTIVITY_LOGS_ROUTES } from './activity-logs.routes';

// ── Models ────────────────────────────────────────────────────────────────────
export type {
  ActivityLog,
  ActivityLogStats,
  ActivityLogPage,
  ActivityLogFilter,
} from './models/activity-log.model';

export {
  ActivityLogCategory,
  ACTIVITY_LOG_CATEGORY_LABELS,
  ACTIVITY_LOG_CATEGORY_COLORS,
  TOP_LEVEL_CATEGORIES,
  ADMIN_SUB_CATEGORIES,
} from './models/activity-log-category.enum';

// ── Services ──────────────────────────────────────────────────────────────────
export { ActivityLogApiService }    from './services/activity-log-api.service';
export { ActivityLogAdminFacade }   from './services/activity-log-admin.facade';
export { ActivityLogUserFacade }    from './services/activity-log-user.facade';

// ── Components (reusable) ─────────────────────────────────────────────────────
export { ActivityLogBadgeComponent }       from './components/activity-log-badge/activity-log-badge.component';
export { ActivityLogTableComponent }       from './components/activity-log-table/activity-log-table.component';
export { ActivityLogFiltersComponent }     from './components/activity-log-filters/activity-log-filters.component';
export { ActivityLogStatsCardComponent }   from './components/activity-log-stats-card/activity-log-stats-card.component';
export { ActivityLogDetailPanelComponent } from './components/activity-log-detail-panel/activity-log-detail-panel.component';

// ── Pages (exposed for embedding, e.g. user-detail) ──────────────────────────
export { UserLogsComponent } from './pages/user-logs/user-logs.component';
