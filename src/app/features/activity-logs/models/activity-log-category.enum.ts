/**
 * Action categories stored in the activity_log.action_category column.
 *
 * Admin sub-categories (ADMIN_USER, ADMIN_ROLE...) are all children of the
 * parent ADMIN. Filtering by ADMIN on the back-end uses LIKE 'ADMIN%' and
 * covers all sub-categories automatically.
 */
export enum ActivityLogCategory {
  // ── Flat categories ──────────────────────────────────────────────────────
  AUTH      = 'AUTH',
  SECURITY  = 'SECURITY',
  ACCOUNT   = 'ACCOUNT',
  DEVICE    = 'DEVICE',
  PASSWORD  = 'PASSWORD',

  // ── Admin parent (matches all ADMIN_* sub-categories) ───────────────────
  ADMIN     = 'ADMIN',

  // ── Admin sub-categories (for granular filtering) ────────────────────────
  ADMIN_USER     = 'ADMIN_USER',
  ADMIN_ROLE     = 'ADMIN_ROLE',
  ADMIN_SECURITY = 'ADMIN_SECURITY',
  ADMIN_AUDIT    = 'ADMIN_AUDIT',
  ADMIN_SYSTEM   = 'ADMIN_SYSTEM',
}

/**
 * Display label for each category — used in the UI (chips, badges, filters).
 */
export const ACTIVITY_LOG_CATEGORY_LABELS: Record<ActivityLogCategory, string> = {
  [ActivityLogCategory.AUTH]:           'Authentication',
  [ActivityLogCategory.SECURITY]:       'Security',
  [ActivityLogCategory.ACCOUNT]:        'Account',
  [ActivityLogCategory.DEVICE]:         'Devices',
  [ActivityLogCategory.PASSWORD]:       'Password',
  [ActivityLogCategory.ADMIN]:          'Admin',
  [ActivityLogCategory.ADMIN_USER]:     'Admin — Users',
  [ActivityLogCategory.ADMIN_ROLE]:     'Admin — Roles',
  [ActivityLogCategory.ADMIN_SECURITY]: 'Admin — Security',
  [ActivityLogCategory.ADMIN_AUDIT]:    'Admin — Audit',
  [ActivityLogCategory.ADMIN_SYSTEM]:   'Admin — System',
};

/**
 * CSS class suffix for badge coloring per category.
 * Used by ActivityLogBadgeComponent: class="badge badge--{color}".
 */
export const ACTIVITY_LOG_CATEGORY_COLORS: Record<ActivityLogCategory, string> = {
  [ActivityLogCategory.AUTH]:           'blue',
  [ActivityLogCategory.SECURITY]:       'red',
  [ActivityLogCategory.ACCOUNT]:        'green',
  [ActivityLogCategory.DEVICE]:         'purple',
  [ActivityLogCategory.PASSWORD]:       'orange',
  [ActivityLogCategory.ADMIN]:          'gray',
  [ActivityLogCategory.ADMIN_USER]:     'gray',
  [ActivityLogCategory.ADMIN_ROLE]:     'gray',
  [ActivityLogCategory.ADMIN_SECURITY]: 'red',
  [ActivityLogCategory.ADMIN_AUDIT]:    'gray',
  [ActivityLogCategory.ADMIN_SYSTEM]:   'gray',
};

/**
 * Top-level categories shown in the admin filter chips.
 * Sub-categories are shown as a secondary filter once ADMIN is selected.
 */
export const TOP_LEVEL_CATEGORIES: ActivityLogCategory[] = [
  ActivityLogCategory.AUTH,
  ActivityLogCategory.SECURITY,
  ActivityLogCategory.ACCOUNT,
  ActivityLogCategory.DEVICE,
  ActivityLogCategory.PASSWORD,
  ActivityLogCategory.ADMIN,
];

/**
 * Admin sub-categories — shown when ADMIN is selected as top-level filter.
 */
export const ADMIN_SUB_CATEGORIES: ActivityLogCategory[] = [
  ActivityLogCategory.ADMIN_USER,
  ActivityLogCategory.ADMIN_ROLE,
  ActivityLogCategory.ADMIN_SECURITY,
  ActivityLogCategory.ADMIN_AUDIT,
  ActivityLogCategory.ADMIN_SYSTEM,
];
