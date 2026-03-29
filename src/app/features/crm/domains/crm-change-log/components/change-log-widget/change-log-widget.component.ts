import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, LowerCasePipe }   from '@angular/common';
import { Router, RouterLink }        from '@angular/router';
import { CrmChangeLogApiService }    from '../../services/crm-change-log-api.service';
import { CrmChangeLogEntry, fieldLabel } from '../../models/crm-change-log.model';

/**
 * Dashboard widget showing the 5 most recent field changes across all CRM entities.
 *
 * Each entry links to the corresponding entity detail page.
 * Self-contained — no facade needed for a simple one-shot load.
 */
@Component({
  selector: 'app-change-log-widget',
  imports: [DatePipe, LowerCasePipe, RouterLink],
  templateUrl: './change-log-widget.component.html',
  styleUrl: './change-log-widget.component.scss'
})
export class ChangeLogWidgetComponent implements OnInit {

  private readonly api    = inject(CrmChangeLogApiService);
  private readonly router = inject(Router);

  entries: CrmChangeLogEntry[] = [];
  loading = true;

  /** Exposes the helper function to the template. */
  readonly fieldLabel = fieldLabel;

  ngOnInit(): void {
    this.api.getRecent(0, 5).subscribe({
      next:  p  => { this.entries = p.content; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  /**
   * Navigates to the detail page of the entity referenced by the given entry.
   *
   * @param entry the change log entry whose entity to navigate to
   */
  navigateTo(entry: CrmChangeLogEntry): void {
    if (!entry.entityPublicId) return;
    let segment: string;
    switch (entry.entityType) {
      case 'CONTACT':      segment = 'contacts';      break;
      case 'ORGANISATION': segment = 'organisations'; break;
      default:             segment = 'deals';
    }
    this.router.navigate(['/crm', segment, entry.entityPublicId]);
  }
}
