import {
  Component, Output, EventEmitter, OnInit,
  inject, signal, computed, HostListener, ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CrmSearchApiService } from '../../services/crm-search-api.service';
import {
  SearchResult,
  SearchResultType,
  SEARCH_TYPE_LABELS,
  SEARCH_TYPE_ROUTES,
  SEARCH_TYPE_ICONS
} from '../../models/search.model';

@Component({
  selector: 'app-crm-search-modal',
  templateUrl: './crm-search-modal.component.html',
  styleUrl: './crm-search-modal.component.scss'
})
export class CrmSearchModalComponent implements OnInit, AfterViewInit {
  @Output() closed = new EventEmitter<void>();

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  private readonly api    = inject(CrmSearchApiService);
  private readonly router = inject(Router);

  readonly query         = signal('');
  readonly results       = signal<SearchResult[]>([]);
  readonly loading       = signal(false);
  readonly focusedIndex  = signal(-1);

  readonly TYPE_LABELS = SEARCH_TYPE_LABELS;
  readonly TYPE_ICONS  = SEARCH_TYPE_ICONS;

  readonly groupedEntries = computed(() => {
    const map = new Map<SearchResultType, SearchResult[]>();
    for (const r of this.results()) {
      if (!map.has(r.type)) map.set(r.type, []);
      map.get(r.type)!.push(r);
    }
    return Array.from(map.entries());
  });

  /** Flat list for keyboard navigation */
  readonly flatResults = computed(() =>
    this.groupedEntries().flatMap(([, items]) => items)
  );

  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(250),
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
        this.focusedIndex.set(-1);
      },
      error: () => this.loading.set(false)
    });
  }

  ngAfterViewInit(): void {
    this.searchInputRef?.nativeElement.focus();
  }

  onInput(value: string): void {
    this.query.set(value);
    this.focusedIndex.set(-1);
    if (value.length < 2) { this.results.set([]); return; }
    this.search$.next(value);
  }

  navigate(result: SearchResult): void {
    this.router.navigate([SEARCH_TYPE_ROUTES[result.type], result.publicId]);
    this.closed.emit();
  }

  isFocused(result: SearchResult): boolean {
    const flat = this.flatResults();
    const idx  = this.focusedIndex();
    return idx >= 0 && flat[idx]?.publicId === result.publicId;
  }

  @HostListener('keydown.arrowDown', ['$event'])
  onArrowDown(e: Event): void {
    e.preventDefault();
    const max = this.flatResults().length - 1;
    this.focusedIndex.update(i => Math.min(i + 1, max));
  }

  @HostListener('keydown.arrowUp', ['$event'])
  onArrowUp(e: Event): void {
    e.preventDefault();
    this.focusedIndex.update(i => Math.max(i - 1, -1));
  }

  @HostListener('keydown.enter')
  onEnter(): void {
    const idx = this.focusedIndex();
    const flat = this.flatResults();
    if (idx >= 0 && flat[idx]) this.navigate(flat[idx]);
  }

  @HostListener('keydown.escape')
  onEscape(): void { this.closed.emit(); }
}
