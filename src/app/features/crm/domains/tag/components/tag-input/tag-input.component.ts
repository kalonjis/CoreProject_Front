import {
  Component, Input, Output, EventEmitter, OnInit,
  inject, signal, computed, ElementRef, HostListener
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmTagApiService } from '../../services/crm-tag-api.service';
import { Tag } from '../../models/tag.model';
import { TagChipComponent } from '../tag-chip/tag-chip.component';

@Component({
  selector: 'app-tag-input',
  imports: [FormsModule, TagChipComponent],
  templateUrl: './tag-input.component.html',
  styleUrl: './tag-input.component.scss'
})
/**
 * Tag input with autocomplete dropdown, inline chip display, and inline tag creation.
 * Emits {@code tagAdded} and {@code tagRemoved} events — entity linking is handled by the parent.
 */
export class TagInputComponent implements OnInit {

  /** Tags already applied to the entity — used to filter them out of suggestions. */
  @Input({ required: true }) entityTags!: Tag[];
  /** Emits the tag to link to the entity when the user selects or creates one. */
  @Output() tagAdded   = new EventEmitter<Tag>();
  /** Emits the tag to unlink from the entity when the user removes a chip. */
  @Output() tagRemoved = new EventEmitter<Tag>();

  private readonly api  = inject(CrmTagApiService);
  private readonly host = inject(ElementRef);

  /** Current text in the search/create input. */
  readonly query      = signal('');
  /** All existing CRM tags fetched on init. */
  readonly allTags    = signal<Tag[]>([]);
  /** Whether the autocomplete dropdown is visible. */
  readonly open       = signal(false);

  /** Tags matching the current query that are not yet applied to the entity. */
  readonly suggestions = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.allTags().filter(t => !this.isApplied(t));
    return this.allTags().filter(t =>
      t.name.toLowerCase().includes(q) && !this.isApplied(t)
    );
  });

  ngOnInit(): void {
    this.api.findAll().subscribe(tags => this.allTags.set(tags));
  }

  /** Returns true when the tag is already in entityTags. */
  isApplied(tag: Tag): boolean {
    return this.entityTags.some(t => t.publicId === tag.publicId);
  }

  /** Emits tagAdded, clears the query, and closes the dropdown. */
  select(tag: Tag): void {
    this.tagAdded.emit(tag);
    this.query.set('');
    this.open.set(false);
  }

  /** Emits tagRemoved to let the parent handle unlinking. */
  remove(tag: Tag): void {
    this.tagRemoved.emit(tag);
  }

  /** Creates a new tag with the current query as name, adds it to allTags, then selects it. */
  createAndAdd(): void {
    const name = this.query().trim();
    if (!name) return;
    this.api.create({ name }).subscribe(tag => {
      this.allTags.update(list => [...list, tag].sort((a, b) => a.name.localeCompare(b.name)));
      this.select(tag);
    });
  }

  /** Returns true when the query is non-empty and does not exactly match an existing tag name. */
  get canCreate(): boolean {
    const q = this.query().trim().toLowerCase();
    return q.length > 0 && !this.allTags().some(t => t.name.toLowerCase() === q);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.host.nativeElement.contains(e.target)) this.open.set(false);
  }
}
