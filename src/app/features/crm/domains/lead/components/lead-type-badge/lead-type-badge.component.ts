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
      background: #f1f5f9;
      color: #475569;
      white-space: nowrap;
    }
  `]
})
export class LeadTypeBadgeComponent {
  @Input({ required: true }) type!: LeadType;

  get label(): string {
    return LEAD_TYPE_LABELS[this.type] ?? this.type;
  }
}
