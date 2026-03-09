// src/app/features/auth/two-factor/components/method-selector/method-selector.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TwoFactorMethod, TwoFactorType } from '../../../../../core/auth';

/**
 * MethodSelectorComponent - Presentational component for 2FA method selection.
 *
 * Displays available 2FA methods as selectable cards.
 * Used when user has multiple 2FA methods enabled.
 *
 * Features:
 * - Displays method icon, name, and description
 * - Highlights primary method
 * - Emits selected method on click
 * - Disabled state during loading
 *
 * Usage:
 * ```html
 * <app-method-selector
 *   [methods]="availableMethods()"
 *   [isLoading]="isLoading()"
 *   (methodSelected)="onMethodSelected($event)">
 * </app-method-selector>
 * ```
 */
@Component({
    selector: 'app-method-selector',
    imports: [CommonModule],
    templateUrl: './method-selector.component.html',
    styleUrl: './method-selector.component.scss'
})
export class MethodSelectorComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** Available 2FA methods to display */
  @Input() methods: TwoFactorMethod[] = [];

  /** Disable selection during loading/processing */
  @Input() isLoading = false;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  /** Emitted when user selects a method */
  @Output() methodSelected = new EventEmitter<TwoFactorType>();

  // ===========================================================================
  // METHODS
  // ===========================================================================

  /**
   * Handle method card click.
   */
  onSelectMethod(method: TwoFactorMethod): void {
    if (this.isLoading) return;
    this.methodSelected.emit(method.type);
  }

  /**
   * Get icon for a 2FA method type.
   */
  getMethodIcon(type: TwoFactorType): string {
    const icons: Record<TwoFactorType, string> = {
      TOTP: '🔐',
      EMAIL: '📧',
      SMS: '📱',
      BACKUP_CODES: '🔑',
      WEBAUTHN: '🛡️'
    };
    return icons[type] ?? '🔒';
  }

  /**
   * TrackBy function for ngFor performance.
   */
  trackByType(_index: number, method: TwoFactorMethod): TwoFactorType {
    return method.type;
  }
}
