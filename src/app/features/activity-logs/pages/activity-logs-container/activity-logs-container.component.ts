// src/app/features/activity-logs/pages/activity-logs-container/activity-logs-container.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Shell container for the activity-logs feature.
 *
 * Renders the tab navigation (All logs / User logs)
 * and the active child route via <router-outlet>.
 *
 * Access is restricted to ADMIN | SUPER_ADMIN via adminGuard on routes.
 */
@Component({
  selector: 'app-activity-logs-container',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './activity-logs-container.component.html',
  styleUrl: './activity-logs-container.component.scss'
})
export class ActivityLogsContainerComponent {

  readonly tabs = [
    { label: 'Tous les logs', route: 'all' },
    { label: 'Par utilisateur', route: 'user' },
  ];
}
