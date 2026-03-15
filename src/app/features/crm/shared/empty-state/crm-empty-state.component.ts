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
