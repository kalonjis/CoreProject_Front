/**
 * Dropdown picker for selecting a CRM commercial (sales rep).
 *
 * Loads all active commercials from {@link CrmUserApiService} on init.
 * Supports an optional "unassigned" null option via the {@link nullable} input.
 * Emits the selected commercial's publicId, or {@code null} when unassigned.
 */
import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmUserApiService } from '../../services/crm-user-api.service';
import { CommercialSummary, commercialDisplayName } from '../../models/commercial.model';

@Component({
  standalone: true,
  selector: 'app-commercial-picker',
  imports: [FormsModule],
  templateUrl: './commercial-picker.component.html'
})
export class CommercialPickerComponent implements OnInit {
  /** When true, an "— Unassigned —" option (null value) is included in the list. */
  @Input() nullable = false;
  /** When true, the select is marked required in the template. */
  @Input() required = false;
  /** Public ID to pre-select on init. */
  @Input() prefilledPublicId = '';
  /** Emits the selected commercial's publicId, or null when unassigned. */
  @Output() selected = new EventEmitter<string | null>();

  private readonly userApi = inject(CrmUserApiService);

  /** All active commercials loaded on init. */
  commercials      = signal<CommercialSummary[]>([]);
  /** Public ID of the currently selected commercial; empty string means none. */
  selectedPublicId = '';
  /** Utility to build a display name from firstName/lastName/username. */
  readonly displayName = commercialDisplayName;

  ngOnInit(): void {
    this.selectedPublicId = this.prefilledPublicId;
    this.userApi.getCommercials().subscribe({
      next: list => this.commercials.set(list),
      error: ()  => {}
    });
  }

  /** Emits the current selection whenever the select value changes. */
  onChange(): void {
    this.selected.emit(this.selectedPublicId || null);
  }
}
