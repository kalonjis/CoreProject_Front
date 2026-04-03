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
  @Input() placeholder = 'Rechercher un contact…';
  /** Label à afficher immédiatement (ex: nom connu au moment du pre-fill) */
  @Input() prefilledLabel = '';
  @Output() selected = new EventEmitter<ContactPickerValue | null>();

  private readonly api      = inject(CrmContactApiService);
  private readonly search$  = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  query         = '';
  selectedLabel = '';
  results       = signal<ContactSummary[]>([]);
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

  onInput(): void {
    if (!this.query.trim()) { this.results.set([]); return; }
    this.search$.next(this.query);
  }

  onBlur(): void {
    setTimeout(() => this.results.set([]), 150);
  }

  select(c: ContactSummary): void {
    this.selectedLabel = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email;
    this.query = '';
    this.results.set([]);
    this.selected.emit({ publicId: c.publicId, label: this.selectedLabel });
  }

  clear(): void {
    this.selectedLabel = '';
    this.query = '';
    this.results.set([]);
    this.selected.emit(null);
  }
}
