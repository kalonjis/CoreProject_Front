/**
 * Displays a neutral badge label for a {@link LeadType}.
 *
 * Uses a single flat style — differentiation is done through the label text, not colour.
 */
import { Component, Input } from '@angular/core';
import { LeadType, LEAD_TYPE_LABELS } from '../../models/lead.model';

@Component({
  selector: 'app-lead-type-badge',
  template: `<span class="lead-type-badge">{{ label }}</span>`,
  styles: [`
    .lead-type-badge {
      display: inline-block;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #fff;
      color: #64748b;
      border: 1px solid #cbd5e1;
      white-space: nowrap;
    }
  `]
})
export class LeadTypeBadgeComponent {
  /** Lead type to render. */
  @Input({ required: true }) type!: LeadType;

  /** Human-readable label for the current type, falling back to the raw enum value. */
  get label(): string {
    return LEAD_TYPE_LABELS[this.type] ?? this.type;
  }
}
