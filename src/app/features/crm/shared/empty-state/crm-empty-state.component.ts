/**
 * Generic empty-state placeholder for CRM list views.
 *
 * Displays an icon, a title, an optional subtitle, and an optional CTA button.
 * Emits {@link ctaClick} when the user clicks the action button.
 */
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crm-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crm-empty-state.component.html',
  styleUrl: './crm-empty-state.component.scss',
})
export class CrmEmptyStateComponent {
  icon    = input<string>('📭');
  title   = input.required<string>();
  subtitle = input<string>('');
  ctaLabel = input<string>('');

  ctaClick = output<void>();
}
