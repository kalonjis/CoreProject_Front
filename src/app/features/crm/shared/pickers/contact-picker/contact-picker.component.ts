/**
 * Typeahead picker for selecting a CRM contact.
 *
 * Searches contacts in real-time via {@link CrmContactApiService} as the user types.
 * Emits a {@link ContactPickerValue} (publicId + display label) on selection, or
 * {@code null} when the selection is cleared.
 */
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { CrmContactApiService } from '../../../domains/contact/services/crm-contact-api.service';
import { ContactSummary } from '../../../domains/contact/models/contact.model';

export interface ContactPickerValue {
  publicId: string;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-contact-picker',
  imports: [FormsModule],
  templateUrl: './contact-picker.component.html',
  styleUrl: './contact-picker.component.scss'
})
export class ContactPickerComponent implements OnInit, OnDestroy {
  /** Placeholder text shown in the search input when empty. */
  @Input() placeholder = 'Rechercher un contact…';
  /** Display label to show immediately without triggering a search (e.g. pre-existing value). */
  @Input() prefilledLabel = '';
  /** Emits the selected contact value, or null when cleared. */
  @Output() selected = new EventEmitter<ContactPickerValue | null>();

  private readonly api      = inject(CrmContactApiService);
  private readonly search$  = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  /** Current text in the search input. */
  query         = '';
  /** Display label of the currently selected contact; shown in place of the input. */
  selectedLabel = '';
  /** Contact results for the current search query (capped at 8). */
  results       = signal<ContactSummary[]>([]);
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
        return this.api.findAll({ keyword: q.trim() }, 0, 8);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next:  page => { this.results.set(page.content); this.searching.set(false); },
      error: ()   => { this.results.set([]);           this.searching.set(false); }
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

  /** Selects a contact, builds its display label, and emits the value. */
  select(c: ContactSummary): void {
    this.selectedLabel = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email;
    this.query = '';
    this.results.set([]);
    this.selected.emit({ publicId: c.publicId, label: this.selectedLabel });
  }

  /** Clears the selection and emits null. */
  clear(): void {
    this.selectedLabel = '';
    this.query = '';
    this.results.set([]);
    this.selected.emit(null);
  }
}
