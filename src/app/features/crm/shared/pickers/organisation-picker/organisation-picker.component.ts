/**
 * Typeahead picker for selecting a CRM organisation.
 *
 * Searches organisations in real-time via {@link CrmOrganisationApiService} as the user types.
 * Emits an {@link OrganisationPickerValue} (publicId + name) on selection, or
 * {@code null} when the selection is cleared.
 */
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { CrmOrganisationApiService } from '../../../domains/organisation/services/crm-organisation-api.service';
import { OrganisationSummary } from '../../../domains/organisation/models/organisation.model';
import { OrganisationStatusBadgeComponent } from '../../../domains/organisation/components/organisation-status-badge/organisation-status-badge.component';

export interface OrganisationPickerValue {
  publicId: string;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-organisation-picker',
  imports: [FormsModule, OrganisationStatusBadgeComponent],
  templateUrl: './organisation-picker.component.html',
  styleUrl: './organisation-picker.component.scss'
})
export class OrganisationPickerComponent implements OnInit, OnDestroy {
  /** Placeholder text shown in the search input when empty. */
  @Input() placeholder = 'Rechercher une organisation…';
  /** Display label to show immediately without triggering a search (e.g. pre-existing value). */
  @Input() prefilledLabel = '';
  /** Emits the selected organisation value, or null when cleared. */
  @Output() selected = new EventEmitter<OrganisationPickerValue | null>();

  private readonly api      = inject(CrmOrganisationApiService);
  private readonly search$  = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  /** Current text in the search input. */
  query         = '';
  /** Display label of the currently selected organisation; shown in place of the input. */
  selectedLabel = '';
  /** Organisation results for the current search query (capped at 8). */
  results       = signal<OrganisationSummary[]>([]);
  /** Whether a search request is in flight. */
  searching     = signal(false);

  ngOnInit(): void {
    if (this.prefilledLabel) {
      this.selectedLabel = this.prefilledLabel;
    }

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(q => q.trim().length >= 2),
      switchMap(q => {
        this.searching.set(true);
        return this.api.findAll({ keyword: q.trim() }, 0);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next:  page => { this.results.set(page.content.slice(0, 8)); this.searching.set(false); },
      error: ()   => { this.results.set([]);                       this.searching.set(false); }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Pushes the current query into the debounced search stream; clears results for empty input. */
  onInput(): void {
    if (!this.query.trim()) { this.results.set([]); return; }
    this.search$.next(this.query);
  }

  /** Collapses the dropdown after a short delay to allow mousedown selection to fire first. */
  onBlur(): void {
    setTimeout(() => this.results.set([]), 150);
  }

  /** Selects an organisation, updates the display label, and emits the value. */
  select(o: OrganisationSummary): void {
    this.selectedLabel = o.name;
    this.query = '';
    this.results.set([]);
    this.selected.emit({ publicId: o.publicId, label: o.name });
  }

  /** Clears the selection and emits null. */
  clear(): void {
    this.selectedLabel = '';
    this.query = '';
    this.results.set([]);
    this.selected.emit(null);
  }
}
