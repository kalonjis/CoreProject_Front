// src/app/features/activity-logs/components/activity-log-filters/activity-log-filters.component.ts

import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ActivityLogCategory,
  ACTIVITY_LOG_CATEGORY_LABELS,
  TOP_LEVEL_CATEGORIES,
  ADMIN_SUB_CATEGORIES,
} from '../../models/activity-log-category.enum';
import { ActivityLogFilter } from '../../models/activity-log.model';

/**
 * Filter bar for activity logs.
 *
 * Purely presentational — emits a new ActivityLogFilter on every change.
 * Never injects a facade.
 *
 * Usage:
 * ```html
 * <app-activity-log-filters
 *   [filter]="facade.filter()"
 *   [hasActiveFilter]="facade.hasActiveFilter()"
 *   (filterChange)="facade.applyFilter($event)"
 *   (reset)="facade.resetFilter()"
 * />
 * ```
 */
@Component({
    selector: 'app-activity-log-filters',
    imports: [CommonModule, FormsModule],
    templateUrl: './activity-log-filters.component.html',
    styleUrl: './activity-log-filters.component.scss'
})
export class ActivityLogFiltersComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  @Input() set filter(value: ActivityLogFilter) {
    this._category.set(value.category ?? null);
    this._from.set(value.from ?? null);
    this._to.set(value.to ?? null);
    this._successful.set(value.successful ?? null);
  }

  @Input() hasActiveFilter = false;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  @Output() filterChange = new EventEmitter<ActivityLogFilter>();
  @Output() reset        = new EventEmitter<void>();

  // ===========================================================================
  // LOCAL STATE
  // ===========================================================================

  private readonly _category   = signal<ActivityLogCategory | string | null>(null);
  private readonly _from       = signal<string | null>(null);
  private readonly _to         = signal<string | null>(null);
  private readonly _successful = signal<boolean | null>(null);

  // ===========================================================================
  // TEMPLATE DATA
  // ===========================================================================

  readonly String = String; // exposed for template use

  readonly topCategories    = TOP_LEVEL_CATEGORIES;
  readonly adminSubCategories = ADMIN_SUB_CATEGORIES;
  readonly categoryLabels   = ACTIVITY_LOG_CATEGORY_LABELS;

  /** Show admin sub-categories when ADMIN is selected */
  readonly showAdminSub = computed(() => this._category() === ActivityLogCategory.ADMIN);

  readonly category   = this._category.asReadonly();
  readonly from       = this._from.asReadonly();
  readonly to         = this._to.asReadonly();
  readonly successful = this._successful.asReadonly();

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  selectCategory(cat: ActivityLogCategory | string | null): void {
    // Clicking the active category deselects it
    this._category.set(this._category() === cat ? null : cat);
    // Reset sub-category if switching away from ADMIN
    this._emit();
  }

  onFromChange(val: string): void {
    this._from.set(val || null);
    this._emit();
  }

  onToChange(val: string): void {
    this._to.set(val || null);
    this._emit();
  }

  onSuccessfulChange(val: string): void {
    this._successful.set(val === '' ? null : val === 'true');
    this._emit();
  }

  onReset(): void {
    this._category.set(null);
    this._from.set(null);
    this._to.set(null);
    this._successful.set(null);
    this.reset.emit();
  }

  // ===========================================================================
  // Private
  // ===========================================================================

  private _emit(): void {
    this.filterChange.emit({
      category:   this._category(),
      from:       this._from(),
      to:         this._to(),
      successful: this._successful(),
    });
  }
}
