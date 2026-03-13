// src/app/features/admin/users/user-detail/components/tabs/admin-deactivation-audit/admin-deactivation-audit.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';

import { AdminUser }                                            from '../../../../models';
import { AdminDeactivationCategory, DeactivationMainCategory } from '../../../../models/admin-deactivation-category.enum';

// ---------------------------------------------------------------------------
// Static label maps  (avoids a service dependency for read-only display)
// ---------------------------------------------------------------------------

/** French display label for each {@link AdminDeactivationCategory} value. */
const CATEGORY_LABELS: Record<AdminDeactivationCategory, string> = {
  [AdminDeactivationCategory.BANNED_HATE_SPEECH]:            'Discours haineux',
  [AdminDeactivationCategory.BANNED_HARASSMENT]:             'Harcèlement',
  [AdminDeactivationCategory.BANNED_INAPPROPRIATE_BEHAVIOR]: 'Comportement inapproprié',
  [AdminDeactivationCategory.LEGAL_REQUEST]:                 'Demande légale',
  [AdminDeactivationCategory.LEGAL_COPYRIGHT]:               'Violation de droit d\'auteur',
  [AdminDeactivationCategory.LEGAL_MINOR_SAFETY]:            'Protection des mineurs',
  [AdminDeactivationCategory.TOS_VIOLATION_SPAM]:            'Spam',
  [AdminDeactivationCategory.TOS_VIOLATION_FRAUD]:           'Fraude',
  [AdminDeactivationCategory.TOS_VIOLATION_IMPERSONATION]:   'Usurpation d\'identité',
  [AdminDeactivationCategory.TOS_VIOLATION_ABUSE]:           'Abus',
  [AdminDeactivationCategory.TOS_VIOLATION_CONTENT]:         'Contenu interdit',
  [AdminDeactivationCategory.SECURITY_RISK_COMPROMISED]:         'Compte compromis',
  [AdminDeactivationCategory.SECURITY_RISK_SUSPICIOUS_ACTIVITY]: 'Activité suspecte',
  [AdminDeactivationCategory.SECURITY_RISK_MALWARE]:             'Logiciel malveillant',
  [AdminDeactivationCategory.MAINTENANCE_SYSTEM_UPGRADE]: 'Mise à niveau système',
  [AdminDeactivationCategory.MAINTENANCE_DATA_CLEANUP]:   'Nettoyage de données',
  [AdminDeactivationCategory.MAINTENANCE_MIGRATION]:      'Migration',
  [AdminDeactivationCategory.ADMIN_ERROR]:        'Erreur administrative',
  [AdminDeactivationCategory.ADMIN_DUPLICATE]:    'Compte dupliqué',
  [AdminDeactivationCategory.ADMIN_USER_REQUEST]: 'Demande utilisateur',
  [AdminDeactivationCategory.ADMIN_INACTIVE]:     'Inactivité prolongée',
  [AdminDeactivationCategory.ADMIN_INVESTIGATION]:'Enquête en cours',
  [AdminDeactivationCategory.OTHER_ADMIN_REASON]: 'Autre raison administrative',
};

/** French display label for each {@link DeactivationMainCategory}. */
const MAIN_CATEGORY_LABELS: Record<DeactivationMainCategory, string> = {
  [DeactivationMainCategory.BANNED]:         'Bannissement',
  [DeactivationMainCategory.LEGAL]:          'Légal',
  [DeactivationMainCategory.TOS_VIOLATION]:  'Violation CGU',
  [DeactivationMainCategory.SECURITY_RISK]:  'Risque sécurité',
  [DeactivationMainCategory.MAINTENANCE]:    'Maintenance',
  [DeactivationMainCategory.ADMINISTRATIVE]: 'Administratif',
};

/** CSS modifier class for each {@link DeactivationMainCategory} (severity colouring). */
const MAIN_CATEGORY_CLASS: Record<DeactivationMainCategory, string> = {
  [DeactivationMainCategory.BANNED]:         'severity--banned',
  [DeactivationMainCategory.LEGAL]:          'severity--legal',
  [DeactivationMainCategory.TOS_VIOLATION]:  'severity--tos',
  [DeactivationMainCategory.SECURITY_RISK]:  'severity--security',
  [DeactivationMainCategory.MAINTENANCE]:    'severity--maintenance',
  [DeactivationMainCategory.ADMINISTRATIVE]: 'severity--admin',
};

/**
 * Read-only administrative deactivation audit block.
 *
 * Rendered inside {@link UserInfoTabComponent} whenever the target user
 * was deactivated by an administrator (i.e. {@link AdminUser.adminDeactivationReason}
 * is non-null).
 *
 * Displays:
 * - Main category badge — colour-coded by severity
 * - Sub-category label  — human-readable French label
 * - Free-text justification ({@link AdminUser.adminDeactivationDetails})
 * - Deactivation date   ({@link AdminUser.adminDeactivatedAt})
 *
 * Purely presentational — no services injected, no side effects.
 *
 * @example
 * ```html
 * @if (user.adminDeactivationReason) {
 *   <app-admin-deactivation-audit [user]="user" />
 * }
 * ```
 */
@Component({
    selector: 'app-admin-deactivation-audit',
    imports: [CommonModule],
    templateUrl: './admin-deactivation-audit.component.html',
    styleUrl: './admin-deactivation-audit.component.scss'
})
export class AdminDeactivationAuditComponent {

  @Input({ required: true }) user!: AdminUser;

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------

  /**
   * Derives the {@link DeactivationMainCategory} from the sub-category prefix.
   * Returns `null` when no category is set (should not happen at render time,
   * but the guard in the parent template prevents that case).
   */
  get mainCategory(): DeactivationMainCategory | null {
    const cat = this.user.adminDeactivationReason;
    if (!cat) return null;
    if (cat.startsWith('BANNED'))      return DeactivationMainCategory.BANNED;
    if (cat.startsWith('LEGAL'))       return DeactivationMainCategory.LEGAL;
    if (cat.startsWith('TOS'))         return DeactivationMainCategory.TOS_VIOLATION;
    if (cat.startsWith('SECURITY'))    return DeactivationMainCategory.SECURITY_RISK;
    if (cat.startsWith('MAINTENANCE')) return DeactivationMainCategory.MAINTENANCE;
    return DeactivationMainCategory.ADMINISTRATIVE;
  }

  /** French label for the resolved main category. */
  get mainCategoryLabel(): string {
    return this.mainCategory ? (MAIN_CATEGORY_LABELS[this.mainCategory] ?? '') : '';
  }

  /** CSS modifier class for the main category badge. */
  get mainCategoryClass(): string {
    return this.mainCategory ? (MAIN_CATEGORY_CLASS[this.mainCategory] ?? 'severity--admin') : '';
  }

  /** French label for the sub-category. Falls back to the raw enum value. */
  get categoryLabel(): string {
    const cat = this.user.adminDeactivationReason;
    return cat ? (CATEGORY_LABELS[cat] ?? cat) : '';
  }
}
