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
  @Input() placeholder = 'Rechercher une organisation…';
  @Input() prefilledLabel = '';
  @Output() selected = new EventEmitter<OrganisationPickerValue | null>();

  private readonly api      = inject(CrmOrganisationApiService);
  private readonly search$  = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  query         = '';
  selectedLabel = '';
  results       = signal<OrganisationSummary[]>([]);
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

  onInput(): void {
    if (!this.query.trim()) { this.results.set([]); return; }
    this.search$.next(this.query);
  }

  onBlur(): void {
    setTimeout(() => this.results.set([]), 150);
  }

  select(o: OrganisationSummary): void {
    this.selectedLabel = o.name;
    this.query = '';
    this.results.set([]);
    this.selected.emit({ publicId: o.publicId, label: o.name });
  }

  clear(): void {
    this.selectedLabel = '';
    this.query = '';
    this.results.set([]);
    this.selected.emit(null);
  }
}
