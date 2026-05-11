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
  /** Emoji or icon displayed above the title. Defaults to '📭'. */
  icon    = input<string>('📭');
  /** Required title line. */
  title   = input.required<string>();
  /** Optional explanatory subtitle shown below the title. */
  subtitle = input<string>('');
  /** Label for the optional CTA button. Hidden when empty. */
  ctaLabel = input<string>('');

  /** Emitted when the user clicks the CTA button. */
  ctaClick = output<void>();
}
