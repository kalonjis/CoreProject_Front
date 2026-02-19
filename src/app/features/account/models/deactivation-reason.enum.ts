// src/app/features/account/models/deactivation-reason.enum.ts

/**
 * Enum representing the possible reasons for user account deactivation.
 *
 * Aligned with backend enum: be.steby.CoreProject.dl.enums.DeactivationReason
 */
export enum DeactivationReason {
  // Self-deactivations that ALLOW reactivation
  TAKING_A_BREAK         = 'TAKING_A_BREAK',
  TOO_MUCH_TIME          = 'TOO_MUCH_TIME',
  PRIVACY_CONCERNS       = 'PRIVACY_CONCERNS',
  ACCOUNT_CLEANUP        = 'ACCOUNT_CLEANUP',
  SWITCHING_ACCOUNTS     = 'SWITCHING_ACCOUNTS',
  WORK_REQUIREMENTS      = 'WORK_REQUIREMENTS',
  NOT_USEFUL             = 'NOT_USEFUL',
  OTHER                  = 'OTHER',

  // Self-deactivation that does NOT allow reactivation
  GDPR_REQUEST           = 'GDPR_REQUEST',
}

/**
 * Display labels for each DeactivationReason.
 * Used in dropdowns and confirmation messages.
 */
export const DEACTIVATION_REASON_LABELS: Record<DeactivationReason, string> = {
  [DeactivationReason.TAKING_A_BREAK]:     'Taking a break',
  [DeactivationReason.TOO_MUCH_TIME]:      'Too much time spent on the application',
  [DeactivationReason.PRIVACY_CONCERNS]:   'Privacy concerns',
  [DeactivationReason.ACCOUNT_CLEANUP]:    'Account cleanup',
  [DeactivationReason.SWITCHING_ACCOUNTS]: 'Switching to another account',
  [DeactivationReason.WORK_REQUIREMENTS]:  'Work requirements',
  [DeactivationReason.NOT_USEFUL]:         'Application no longer useful',
  [DeactivationReason.OTHER]:              'Other reason',
  [DeactivationReason.GDPR_REQUEST]:       'GDPR deletion request',
};

/**
 * Indicates whether a given reason allows account reactivation.
 * Mirrors backend DeactivationReason.allowsReactivation()
 */
export const DEACTIVATION_REASON_ALLOWS_REACTIVATION: Record<DeactivationReason, boolean> = {
  [DeactivationReason.TAKING_A_BREAK]:     true,
  [DeactivationReason.TOO_MUCH_TIME]:      true,
  [DeactivationReason.PRIVACY_CONCERNS]:   true,
  [DeactivationReason.ACCOUNT_CLEANUP]:    true,
  [DeactivationReason.SWITCHING_ACCOUNTS]: true,
  [DeactivationReason.WORK_REQUIREMENTS]:  true,
  [DeactivationReason.NOT_USEFUL]:         true,
  [DeactivationReason.OTHER]:              true,
  [DeactivationReason.GDPR_REQUEST]:       false,
};

/**
 * Utility functions for DeactivationReason.
 */
export const DeactivationReasonUtils = {

  /** Returns all reasons as options for a select/dropdown. */
  all(): { value: DeactivationReason; label: string }[] {
    return Object.values(DeactivationReason).map(r => ({
      value: r,
      label: DEACTIVATION_REASON_LABELS[r],
    }));
  },

  /** Returns only reasons that allow reactivation (exclude GDPR). */
  reactivable(): { value: DeactivationReason; label: string }[] {
    return this.all().filter(r => DEACTIVATION_REASON_ALLOWS_REACTIVATION[r.value]);
  },

  /** Returns true if the given reason allows reactivation. */
  allowsReactivation(reason: DeactivationReason): boolean {
    return DEACTIVATION_REASON_ALLOWS_REACTIVATION[reason];
  },

  /** Returns the display label for a given reason. */
  label(reason: DeactivationReason): string {
    return DEACTIVATION_REASON_LABELS[reason];
  },
};
