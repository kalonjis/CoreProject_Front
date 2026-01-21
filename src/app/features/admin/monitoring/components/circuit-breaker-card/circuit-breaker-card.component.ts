// src/app/features/admin/system-health/components/circuit-breaker-card/circuit-breaker-card.component.ts

import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CircuitBreakerState, CircuitBreakerStatus} from '../../models';


/** Action types for circuit breaker operations */
export type CircuitBreakerActionType = 'reset' | 'forceOpen' | 'forceClose';

/** Event emitted when an action is triggered */
export interface CircuitBreakerActionEvent {
  name: string;
  action: CircuitBreakerActionType;
}

/**
 * Circuit Breaker Card component.
 *
 * Displays the status of all circuit breakers with manual controls.
 * Each circuit breaker shows:
 * - Name and current state
 * - Failure rate and call statistics
 * - Action buttons (Reset, Force Open, Force Close)
 *
 * State indicators:
 * - CLOSED: Green (normal operation)
 * - OPEN: Red (blocking requests)
 * - HALF_OPEN: Yellow (testing recovery)
 * - FORCED_OPEN: Orange (manually opened)
 * - DISABLED: Gray
 *
 * Actions require confirmation for destructive operations.
 * Used in the System Health dashboard.
 */
@Component({
  selector: 'app-circuit-breaker-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './circuit-breaker-card.component.html',
  styleUrl: './circuit-breaker-card.component.scss'
})
export class CircuitBreakerCardComponent {

  // ===========================================================================
  // INPUTS / OUTPUTS
  // ===========================================================================

  /** List of circuit breaker statuses to display */
  @Input({ required: true }) set circuitBreakers(value: CircuitBreakerStatus[]) {
    this._circuitBreakers.set(value);
  }

  /** Loading state from parent */
  @Input() isLoading = false;

  /** Emits when an action is triggered on a circuit breaker */
  @Output() action = new EventEmitter<CircuitBreakerActionEvent>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  private readonly _circuitBreakers = signal<CircuitBreakerStatus[]>([]);

  /** Exposed circuit breakers for template */
  readonly circuitBreakers$ = computed(() => this._circuitBreakers());

  /** Currently selected circuit breaker for confirmation modal */
  readonly pendingAction = signal<{ cb: CircuitBreakerStatus; action: CircuitBreakerActionType } | null>(null);

  /** Action in progress (name of CB being acted upon) */
  readonly actionInProgress = signal<string | null>(null);

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Count of circuit breakers in CLOSED state */
  readonly closedCount = computed(() =>
    this._circuitBreakers().filter(cb => cb.state === 'CLOSED').length
  );

  /** Total number of circuit breakers */
  readonly totalCount = computed(() => this._circuitBreakers().length);

  /** True if all circuit breakers are closed */
  readonly allClosed = computed(() =>
    this.closedCount() === this.totalCount() && this.totalCount() > 0
  );

  /** True if any circuit breaker is open */
  readonly hasOpenBreaker = computed(() =>
    this._circuitBreakers().some(cb =>
      cb.state === 'OPEN' || cb.state === 'FORCED_OPEN'
    )
  );

  // ===========================================================================
  // STATE HELPERS
  // ===========================================================================

  /**
   * Returns the CSS class for a circuit breaker state.
   *
   * @param state Circuit breaker state
   * @returns CSS class name
   */
  getStateClass(state: CircuitBreakerState): string {
    switch (state) {
      case 'CLOSED':
        return 'state-closed';
      case 'OPEN':
        return 'state-open';
      case 'HALF_OPEN':
        return 'state-half-open';
      case 'FORCED_OPEN':
        return 'state-forced-open';
      case 'DISABLED':
        return 'state-disabled';
      case 'METRICS_ONLY':
        return 'state-metrics-only';
      default:
        return 'state-unknown';
    }
  }

  /**
   * Returns a human-readable label for a circuit breaker state.
   *
   * @param state Circuit breaker state
   * @returns Display label
   */
  getStateLabel(state: CircuitBreakerState): string {
    switch (state) {
      case 'CLOSED':
        return 'Closed';
      case 'OPEN':
        return 'Open';
      case 'HALF_OPEN':
        return 'Half-Open';
      case 'FORCED_OPEN':
        return 'Forced Open';
      case 'DISABLED':
        return 'Disabled';
      case 'METRICS_ONLY':
        return 'Metrics Only';
      default:
        return 'Unknown';
    }
  }

  /**
   * Returns an icon for the circuit breaker based on its name.
   *
   * @param name Circuit breaker name
   * @returns Emoji icon
   */
  getIcon(name: string): string {
    if (name.toLowerCase().includes('smtp') || name.toLowerCase().includes('mail')) {
      return '📧';
    }
    if (name.toLowerCase().includes('twilio') || name.toLowerCase().includes('sms')) {
      return '📱';
    }
    if (name.toLowerCase().includes('nominatim') || name.toLowerCase().includes('geo')) {
      return '🗺️';
    }
    return '⚡';
  }

  /**
   * Returns a display-friendly name for the circuit breaker.
   *
   * @param name Raw circuit breaker name
   * @returns Formatted display name
   */
  getDisplayName(name: string): string {
    // smtpBackend → SMTP
    // twilioBackend → Twilio SMS
    if (name === 'smtpBackend') return 'SMTP Email';
    if (name === 'twilioBackend') return 'Twilio SMS';

    // Default: remove "Backend" suffix and capitalize
    return name.replace(/Backend$/i, '').replace(/([A-Z])/g, ' $1').trim();
  }

  /**
   * Formats the failure rate for display.
   * Returns "N/A" if rate is -1 (not enough data).
   *
   * @param rate Failure rate (-1 to 100)
   * @returns Formatted string
   */
  formatFailureRate(rate: number): string {
    if (rate < 0) return 'N/A';
    return `${rate.toFixed(1)}%`;
  }

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Initiates an action on a circuit breaker.
   * For destructive actions (forceOpen), shows confirmation first.
   *
   * @param cb Circuit breaker to act on
   * @param actionType Type of action
   */
  initiateAction(cb: CircuitBreakerStatus, actionType: CircuitBreakerActionType): void {
    // Force open requires confirmation
    if (actionType === 'forceOpen') {
      this.pendingAction.set({ cb, action: actionType });
      return;
    }

    // Other actions can proceed directly
    this.executeAction(cb.name, actionType);
  }

  /**
   * Confirms and executes a pending action.
   */
  confirmAction(): void {
    const pending = this.pendingAction();
    if (pending) {
      this.executeAction(pending.cb.name, pending.action);
      this.pendingAction.set(null);
    }
  }

  /**
   * Cancels a pending action.
   */
  cancelAction(): void {
    this.pendingAction.set(null);
  }

  /**
   * Executes the action and emits the event.
   *
   * @param name Circuit breaker name
   * @param actionType Action type
   */
  private executeAction(name: string, actionType: CircuitBreakerActionType): void {
    this.actionInProgress.set(name);
    this.action.emit({ name, action: actionType });

    // Reset action in progress after a delay (parent will refresh data)
    setTimeout(() => {
      this.actionInProgress.set(null);
    }, 2000);
  }

  /**
   * Checks if an action is currently in progress for a circuit breaker.
   *
   * @param name Circuit breaker name
   * @returns True if action in progress
   */
  isActionInProgress(name: string): boolean {
    return this.actionInProgress() === name;
  }

  /**
   * Tracks circuit breaker items by their name.
   *
   * @param index Item index
   * @param item Circuit breaker status
   * @returns Unique identifier
   */
  trackByName(index: number, item: CircuitBreakerStatus): string {
    return item.name;
  }
}
