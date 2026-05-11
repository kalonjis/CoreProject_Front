import {
  Component, inject, signal, computed, ElementRef, HostListener, ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CrmSearchApiService } from '../../services/crm-search-api.service';
import {
  SearchResult, SearchResultType,
  SEARCH_TYPE_LABELS, SEARCH_TYPE_ROUTES, SEARCH_TYPE_ICONS
} from '../../models/search.model';

@Component({
  selector: 'app-crm-search-bar',
  imports: [FormsModule],
  templateUrl: './crm-search-bar.component.html',
  styleUrl: './crm-search-bar.component.scss'
})
/**
 * CRM search bar with debounced live search, grouped results dropdown,
 * and keyboard navigation (Escape to close, click-outside dismissal).
 */
export class CrmSearchBarComponent {

  private readonly api    = inject(CrmSearchApiService);
  private readonly router = inject(Router);
  private readonly host   = inject(ElementRef);

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  /** Current text entered in the search input. */
  readonly query   = signal('');
  /** Flat list of results returned by the last API call. */
  readonly results = signal<SearchResult[]>([]);
  /** Whether a search request is in flight. */
  readonly loading = signal(false);
  /** Whether the results dropdown is visible. */
  readonly open    = signal(false);

  readonly TYPE_LABELS = SEARCH_TYPE_LABELS;
  readonly TYPE_ROUTES = SEARCH_TYPE_ROUTES;
  readonly TYPE_ICONS  = SEARCH_TYPE_ICONS;

  /** Results grouped by entity type for section rendering in the dropdown. */
  readonly grouped = computed(() => {
    const map = new Map<SearchResultType, SearchResult[]>();
    for (const r of this.results()) {
      if (!map.has(r.type)) map.set(r.type, []);
      map.get(r.type)!.push(r);
    }
    return map;
  });

  /** Iterable entries of grouped results for use in @for loops. */
  readonly groupedEntries = computed(() => Array.from(this.grouped().entries()));

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.results.set([]); this.loading.set(false); return []; }
        this.loading.set(true);
        return this.api.search(q);
      })
    ).subscribe({
      next: res => {
        if (res) { this.results.set(res.results); }
        this.loading.set(false);
        this.open.set(true);
      },
      error: () => this.loading.set(false)
    });
  }

  /** Updates the query signal and pushes the value into the debounced search stream. */
  onInput(value: string): void {
    this.query.set(value);
    if (value.length < 2) { this.results.set([]); this.open.set(false); return; }
    this.search$.next(value);
  }

  /** Navigates to the entity detail page for the given result and closes the dropdown. */
  navigate(result: SearchResult): void {
    this.router.navigate([SEARCH_TYPE_ROUTES[result.type], result.publicId]);
    this.close();
  }

  /** Hides the dropdown and resets query and results. */
  close(): void {
    this.open.set(false);
    this.query.set('');
    this.results.set([]);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }
}
