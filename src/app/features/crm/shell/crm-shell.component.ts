/**
 * Root shell component for the CRM feature.
 *
 * Renders the sidebar and the main {@code router-outlet}.
 * Listens for Ctrl+K / ⌘+K to toggle the global search modal.
 */
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CrmSidebarComponent } from './crm-sidebar.component';
import { CrmSearchModalComponent } from '../domains/search/components/crm-search-modal/crm-search-modal.component';
import { AgendaDayPanelComponent } from '../shared/components/agenda-day-panel/agenda-day-panel.component';
import { CallWidgetComponent } from '../../../shared/call-widget/call-widget.component';
import { SipService } from '../../../core/telephony/services/sip.service';
import { TwilioService } from '../../../core/telephony/services/twilio.service';
import { CallApiService } from '../../../core/telephony/services/call-api.service';

@Component({
  selector: 'app-crm-shell',
  imports: [RouterOutlet, CrmSidebarComponent, CrmSearchModalComponent, AgendaDayPanelComponent, CallWidgetComponent],
  templateUrl: './crm-shell.component.html',
  styleUrl: './crm-shell.component.scss'
})
export class CrmShellComponent implements OnInit {

  private readonly sip    = inject(SipService);
  private readonly twilio = inject(TwilioService);
  private readonly api    = inject(CallApiService);

  /** Controls the visibility of the global search modal. */
  readonly showSearch = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const { provider } = await firstValueFrom(this.api.getMyProvider());
      if (provider === 'SIP')    await this.sip.initialize();
      if (provider === 'TWILIO') await this.twilio.initialize();
      // TEL_URI / NONE: no SDK to initialize
    } catch {
      // Network error on startup — no telephony available
    }
  }

  /** Toggles the search modal on Ctrl+K / ⌘+K. */
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.showSearch.update(v => !v);
    }
  }
}
