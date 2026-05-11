/**
 * Root shell component for the CRM feature.
 *
 * Renders the sidebar and the main {@code router-outlet}.
 * Listens for Ctrl+K / ⌘+K to toggle the global search modal.
 */
import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CrmSidebarComponent } from './crm-sidebar.component';
import { CrmSearchModalComponent } from '../domains/search/components/crm-search-modal/crm-search-modal.component';
import { AgendaDayPanelComponent } from '../shared/components/agenda-day-panel/agenda-day-panel.component';

@Component({
  selector: 'app-crm-shell',
  imports: [RouterOutlet, CrmSidebarComponent, CrmSearchModalComponent, AgendaDayPanelComponent],
  templateUrl: './crm-shell.component.html',
  styleUrl: './crm-shell.component.scss'
})
export class CrmShellComponent {
  /** Controls the visibility of the global search modal. */
  readonly showSearch = signal(false);

  /** Toggles the search modal on Ctrl+K / ⌘+K. */
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.showSearch.update(v => !v);
    }
  }
}
