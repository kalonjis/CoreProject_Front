// src/app/features/account/components/security-tab/components/two-factor-section/components/methods-overview/methods-overview.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  TwoFactorType,
  TwoFactorMethod
} from '../../../../../../../../core/auth/models/two-factor.model';

/**
 * Methods overview component.
 *
 * Displays a list of all available 2FA methods with their status.
 * Emits events for method selection and actions.
 *
 * This is a presentational component that receives data and emits events.
 */
@Component({
  selector: 'app-methods-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './methods-overview.component.html',
  styleUrl: './methods-overview.component.scss'
})
export class MethodsOverviewComponent {

  /**
   * List of 2FA methods to display.
   */
  @Input({ required: true }) methods: TwoFactorMethod[] = [];

  /**
   * Event emitted when a method is selected for detailed view.
   */
  @Output() methodSelected = new EventEmitter<TwoFactorMethod>();

  /**
   * Event emitted when user wants to enable a method.
   */
  @Output() enableMethod = new EventEmitter<TwoFactorMethod>();

  /**
   * Event emitted when user wants to disable a method.
   */
  @Output() disableMethod = new EventEmitter<TwoFactorMethod>();

  /**
   * Get icon for 2FA method type.
   */
  getMethodIcon(type: TwoFactorType): string {
    const icons: Record<TwoFactorType, string> = {
      EMAIL: '📧',
      SMS: '📱',
      TOTP: '🔐',
      BACKUP_CODES: '🗝️',
      WEBAUTHN: '🔑'
    };
    return icons[type];
  }

  /**
   * Handle method card click to show detail view.
   */
  onMethodClick(method: TwoFactorMethod): void {
    this.methodSelected.emit(method);
  }

  /**
   * Handle enable button click.
   */
  onEnableClick(event: Event, method: TwoFactorMethod): void {
    event.stopPropagation(); // Prevent method selection
    this.enableMethod.emit(method);
  }

  /**
   * Handle disable button click.
   */
  onDisableClick(event: Event, method: TwoFactorMethod): void {
    event.stopPropagation(); // Prevent method selection
    this.disableMethod.emit(method);
  }
}
