/**
 * Displays a colour-coded badge for an {@link InteractionType}.
 *
 * Renders an icon and a human-readable label styled per interaction type.
 */
import { Component, Input } from '@angular/core';
import { InteractionType, INTERACTION_TYPE_LABELS } from '../../models/interaction.model';

@Component({
  selector: 'app-interaction-type-badge',
  template: `
    <span class="interaction-type-badge interaction-type-badge--{{ type.toLowerCase() }}">
      <span class="interaction-type-badge__icon">{{ icon }}</span>
      {{ label }}
    </span>
  `,
  styles: [`
    .interaction-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;

      &--call        { background: #dbeafe; color: #1d4ed8; }
      &--email       { background: #ede9fe; color: #7c3aed; }
      &--meeting     { background: #d1fae5; color: #065f46; }
      &--note        { background: #fef9c3; color: #854d0e; }
      &--visit       { background: #ffedd5; color: #9a3412; }
      &--demo         { background: #fdf4ff; color: #7e22ce; }
      &--action_done  { background: #f0fdf4; color: #15803d; }
      &--contact_form { background: #f1f5f9; color: #475569; }
    }
  `]
})
export class InteractionTypeBadgeComponent {
  /** Interaction type to render. */
  @Input({ required: true }) type!: InteractionType;

  /** Human-readable label for the current type. */
  get label(): string  { return INTERACTION_TYPE_LABELS[this.type]; }
  /** Emoji icon representing the current interaction type. */
  get icon(): string {
    const icons: Record<InteractionType, string> = {
      [InteractionType.CALL]:        '📞',
      [InteractionType.EMAIL]:       '✉️',
      [InteractionType.MEETING]:     '🤝',
      [InteractionType.NOTE]:        '📝',
      [InteractionType.VISIT]:       '🚗',
      [InteractionType.DEMO]:        '🎯',
      [InteractionType.ACTION_DONE]:  '✅',
      [InteractionType.CONTACT_FORM]: '📋'
    };
    return icons[this.type];
  }
}
