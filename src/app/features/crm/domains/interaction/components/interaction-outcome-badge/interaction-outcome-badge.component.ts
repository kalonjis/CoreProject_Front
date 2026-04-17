/**
 * Displays a colour-coded badge for an {@link InteractionOutcome}.
 *
 * Positive, neutral, negative, and no-answer outcomes each render with a distinct style.
 */
import { Component, Input } from '@angular/core';
import { InteractionOutcome, INTERACTION_OUTCOME_LABELS } from '../../models/interaction.model';

@Component({
  selector: 'app-interaction-outcome-badge',
  template: `
    <span class="outcome-badge outcome-badge--{{ outcome.toLowerCase() }}">
      {{ label }}
    </span>
  `,
  styles: [`
    .outcome-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;

      &--positive  { background: #d1fae5; color: #065f46; }
      &--neutral   { background: #f3f4f6; color: #374151; }
      &--negative  { background: #fee2e2; color: #991b1b; }
      &--no_answer { background: #fef3c7; color: #92400e; }
    }
  `]
})
export class InteractionOutcomeBadgeComponent {
  @Input({ required: true }) outcome!: InteractionOutcome;

  get label(): string { return INTERACTION_OUTCOME_LABELS[this.outcome]; }
}
