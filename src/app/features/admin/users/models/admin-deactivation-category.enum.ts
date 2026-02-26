/**
 * Administrative deactivation categories.
 *
 * Mirrors the Java enum {@code AdminDeactivationCategory} and its parent
 * {@code DeactivationMainCategory}. Each value maps directly to a backend
 * enum constant serialized as a plain string in the API.
 *
 * Categories are grouped by main category for UI rendering (e.g. grouped
 * select, section headers).
 */

// ---------------------------------------------------------------------------
// Main categories — used for grouping in the UI
// ---------------------------------------------------------------------------

export enum DeactivationMainCategory {
  BANNED         = 'BANNED',
  TOS_VIOLATION  = 'TOS_VIOLATION',
  SECURITY_RISK  = 'SECURITY_RISK',
  LEGAL          = 'LEGAL',
  MAINTENANCE    = 'MAINTENANCE',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
}

// ---------------------------------------------------------------------------
// Sub-categories — sent to the API as the deactivation reason
// ---------------------------------------------------------------------------

export enum AdminDeactivationCategory {

  // Banned
  BANNED_HATE_SPEECH            = 'BANNED_HATE_SPEECH',
  BANNED_HARASSMENT             = 'BANNED_HARASSMENT',
  BANNED_INAPPROPRIATE_BEHAVIOR = 'BANNED_INAPPROPRIATE_BEHAVIOR',

  // Legal
  LEGAL_REQUEST                 = 'LEGAL_REQUEST',
  LEGAL_COPYRIGHT               = 'LEGAL_COPYRIGHT',
  LEGAL_MINOR_SAFETY            = 'LEGAL_MINOR_SAFETY',

  // Terms of Service violations
  TOS_VIOLATION_SPAM            = 'TOS_VIOLATION_SPAM',
  TOS_VIOLATION_FRAUD           = 'TOS_VIOLATION_FRAUD',
  TOS_VIOLATION_IMPERSONATION   = 'TOS_VIOLATION_IMPERSONATION',
  TOS_VIOLATION_ABUSE           = 'TOS_VIOLATION_ABUSE',
  TOS_VIOLATION_CONTENT         = 'TOS_VIOLATION_CONTENT',

  // Security risks
  SECURITY_RISK_COMPROMISED         = 'SECURITY_RISK_COMPROMISED',
  SECURITY_RISK_SUSPICIOUS_ACTIVITY = 'SECURITY_RISK_SUSPICIOUS_ACTIVITY',
  SECURITY_RISK_MALWARE             = 'SECURITY_RISK_MALWARE',

  // Maintenance
  MAINTENANCE_SYSTEM_UPGRADE = 'MAINTENANCE_SYSTEM_UPGRADE',
  MAINTENANCE_DATA_CLEANUP   = 'MAINTENANCE_DATA_CLEANUP',
  MAINTENANCE_MIGRATION      = 'MAINTENANCE_MIGRATION',

  // Administrative
  ADMIN_ERROR        = 'ADMIN_ERROR',
  ADMIN_DUPLICATE    = 'ADMIN_DUPLICATE',
  ADMIN_USER_REQUEST = 'ADMIN_USER_REQUEST',
  ADMIN_INACTIVE     = 'ADMIN_INACTIVE',
  ADMIN_INVESTIGATION= 'ADMIN_INVESTIGATION',
  OTHER_ADMIN_REASON = 'OTHER_ADMIN_REASON',
}
