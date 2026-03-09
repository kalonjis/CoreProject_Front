import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ModuleCardConfig } from '../../../models/module-card-config.model';

/**
 * Reusable module card component for admin dashboard.
 * Displays a clickable card that navigates to a specific admin module.
 *
 * Can be disabled to show "coming soon" modules.
 *
 * Usage:
 * <app-module-card [config]="moduleConfig"></app-module-card>
 */
@Component({
    selector: 'app-module-card',
    imports: [CommonModule, RouterLink],
    templateUrl: './module-card.component.html',
    styleUrl: './module-card.component.scss'
})
export class ModuleCardComponent {
  /**
   * Module configuration containing all display and routing information.
   */
  @Input({ required: true }) config!: ModuleCardConfig;
}
