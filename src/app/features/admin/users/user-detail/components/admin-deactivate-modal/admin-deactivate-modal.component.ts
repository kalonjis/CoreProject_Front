// src/app/features/admin/users/user-detail/components/admin-deactivate-modal/admin-deactivate-modal.component.ts

import { Component, Input, Output, EventEmitter, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import {
  AdminDeactivationCategory,
  DeactivationCategoryItem,
  DeactivationMainCategory,
  UserDeactivationRequest
} from '../../../models';
import {AdminUserFacade} from '../../../services/admin-user-facade.service';


/** French label for each main category — used as `<optgroup>` labels. */
const MAIN_LABELS: Record<DeactivationMainCategory, string> = {
  [DeactivationMainCategory.BANNED]:         'Bannissements',
  [DeactivationMainCategory.TOS_VIOLATION]:  'Violations CGU',
  [DeactivationMainCategory.SECURITY_RISK]:  'Risques sécurité',
  [DeactivationMainCategory.LEGAL]:          'Légal',
  [DeactivationMainCategory.MAINTENANCE]:    'Maintenance',
  [DeactivationMainCategory.ADMINISTRATIVE]: 'Administratif',
};

/** Display order for main categories in the select. */
const MAIN_ORDER: DeactivationMainCategory[] = [
  DeactivationMainCategory.BANNED,
  DeactivationMainCategory.TOS_VIOLATION,
  DeactivationMainCategory.SECURITY_RISK,
  DeactivationMainCategory.LEGAL,
  DeactivationMainCategory.ADMINISTRATIVE,
  DeactivationMainCategory.MAINTENANCE,
];

/**
 * Administrative deactivation modal.
 *
 * Rendered at the container level (portal-style) — the parent container
 * controls visibility via `showDeactivateModal` and listens to the two outputs.
 *
 * Flow:
 * 1. On init, calls {@link AdminUserFacade.loadDeactivationCategories} (no-op if already cached).
 * 2. The admin selects a category from a grouped `<select>`.
 * 3. A hint line shows the selected category's description and reactivation policy.
 * 4. The admin fills in a mandatory justification (10–500 chars).
 * 5. On submit, calls {@link AdminUserFacade.deactivateUser} and emits {@link confirmed}.
 * 6. Pressing "Cancel" or the backdrop emits {@link cancelled} without any API call.
 *
 * @example
 * ```html
 * @if (showDeactivateModal() && user()) {
 *   <app-admin-deactivate-modal
 *     [publicId]="user()!.publicId"
 *     [username]="user()!.username"
 *     (confirmed)="onDeactivationConfirmed()"
 *     (cancelled)="onDeactivationCancelled()" />
 * }
 * ```
 */
@Component({
    selector: 'app-admin-deactivate-modal',
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-deactivate-modal.component.html',
    styleUrl: './admin-deactivate-modal.component.scss'
})
export class AdminDeactivateModalComponent implements OnInit {

  @Input({ required: true }) publicId!: string;
  @Input({ required: true }) username!: string;

  /** Emitted when the deactivation was confirmed and completed successfully. */
  @Output() confirmed = new EventEmitter<void>();

  /** Emitted when the admin cancels without performing any mutation. */
  @Output() cancelled = new EventEmitter<void>();

  // ---------------------------------------------------------------------------
  // Dependencies
  // ---------------------------------------------------------------------------

  protected readonly facade = inject(AdminUserFacade);

  // ---------------------------------------------------------------------------
  // Form state
  // ---------------------------------------------------------------------------

  readonly selectedCategory = signal<AdminDeactivationCategory | ''>('');
  readonly details          = signal('');
  readonly submitError      = signal<string | null>(null);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  readonly detailsLength   = computed(() => this.details().trim().length);
  readonly detailsValid    = computed(() => this.detailsLength() >= 10 && this.detailsLength() <= 500);
  readonly categoryValid   = computed(() => this.selectedCategory() !== '');
  readonly formValid       = computed(() => this.categoryValid() && this.detailsValid());

  // ---------------------------------------------------------------------------
  // Grouped categories for the select
  // ---------------------------------------------------------------------------

  /**
   * Available categories grouped by main category, in display order.
   * Derived from the facade's filtered signal.
   */
  readonly groupedCategories = computed(() => {
    const cats = this.facade.availableDeactivationCategories();
    return MAIN_ORDER
      .map(main => ({
        label:  MAIN_LABELS[main],
        items:  cats.filter(c => c.mainCategory === main),
      }))
      .filter(g => g.items.length > 0);
  });

  /**
   * The full {@link DeactivationCategoryItem} for the currently selected value.
   * Used to display the description hint and reactivation policy.
   */
  readonly selectedCategoryItem = computed<DeactivationCategoryItem | null>(() => {
    const val = this.selectedCategory();
    if (!val) return null;
    return this.facade.availableDeactivationCategories().find(c => c.value === val) ?? null;
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    this.facade.loadDeactivationCategories();
  }

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value as AdminDeactivationCategory | '');
    this.submitError.set(null);
  }

  onDetailsChange(value: string): void {
    this.details.set(value);
    this.submitError.set(null);
  }

  onBackdropClick(): void {
    if (!this.facade.isMutating()) this.cancelled.emit();
  }

  onCancel(): void {
    if (!this.facade.isMutating()) this.cancelled.emit();
  }

  onSubmit(): void {
    if (!this.formValid() || this.facade.isMutating()) return;

    this.submitError.set(null);

    const request: UserDeactivationRequest = {
      deactivationCategory:     this.selectedCategory() as AdminDeactivationCategory,
      adminDeactivationDetails: this.details().trim(),
    };

    this.facade.deactivateUser(this.publicId, request).subscribe({
      next:  () => this.confirmed.emit(),
      error: err => this.submitError.set(err?.message ?? 'Une erreur est survenue.'),
    });
  }
}
