/**
 * Action categories stored in the activity_log.action_category column.
 *
 * Admin sub-categories (ADMIN_USER, ADMIN_ROLE...) are all children of the
 * parent ADMIN. Filtering by ADMIN on the back-end uses LIKE 'ADMIN%' and
 * covers all sub-categories automatically.
 *
 * CRM sub-categories (CRM_CONTACT, CRM_DEAL...) are all children of the
 * parent CRM. Filtering by CRM on the back-end uses LIKE 'CRM%'.
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

  // ── CRM parent (matches all CRM_* sub-categories) ───────────────────────
  CRM     = 'CRM',

  // ── CRM sub-categories (for granular filtering) ──────────────────────────
  CRM_CONTACT      = 'CRM_CONTACT',
  CRM_DEAL         = 'CRM_DEAL',
  CRM_LEAD         = 'CRM_LEAD',
  CRM_ORGANISATION = 'CRM_ORGANISATION',
  CRM_SUPPORT      = 'CRM_SUPPORT',
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
  [ActivityLogCategory.CRM]:            'CRM',
  [ActivityLogCategory.CRM_CONTACT]:    'CRM — Contacts',
  [ActivityLogCategory.CRM_DEAL]:       'CRM — Deals',
  [ActivityLogCategory.CRM_LEAD]:       'CRM — Leads',
  [ActivityLogCategory.CRM_ORGANISATION]: 'CRM — Organisations',
  [ActivityLogCategory.CRM_SUPPORT]:      'CRM — Support',
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
  [ActivityLogCategory.CRM]:            'teal',
  [ActivityLogCategory.CRM_CONTACT]:    'teal',
  [ActivityLogCategory.CRM_DEAL]:       'teal',
  [ActivityLogCategory.CRM_LEAD]:       'teal',
  [ActivityLogCategory.CRM_ORGANISATION]: 'teal',
  [ActivityLogCategory.CRM_SUPPORT]:      'teal',
};

/**
 * Top-level categories shown in the admin filter chips.
 * Sub-categories are shown as a secondary filter once ADMIN or CRM is selected.
 */
export const TOP_LEVEL_CATEGORIES: ActivityLogCategory[] = [
  ActivityLogCategory.AUTH,
  ActivityLogCategory.SECURITY,
  ActivityLogCategory.ACCOUNT,
  ActivityLogCategory.DEVICE,
  ActivityLogCategory.PASSWORD,
  ActivityLogCategory.ADMIN,
  ActivityLogCategory.CRM,
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

/**
 * CRM sub-categories — shown when CRM is selected as top-level filter.
 */
export const CRM_SUB_CATEGORIES: ActivityLogCategory[] = [
  ActivityLogCategory.CRM_CONTACT,
  ActivityLogCategory.CRM_DEAL,
  ActivityLogCategory.CRM_LEAD,
  ActivityLogCategory.CRM_ORGANISATION,
  ActivityLogCategory.CRM_SUPPORT,
];
