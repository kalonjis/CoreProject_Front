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
export class TagInputComponent implements OnInit {

  @Input({ required: true }) entityTags!: Tag[];
  @Output() tagAdded   = new EventEmitter<Tag>();
  @Output() tagRemoved = new EventEmitter<Tag>();

  private readonly api  = inject(CrmTagApiService);
  private readonly host = inject(ElementRef);

  readonly query      = signal('');
  readonly allTags    = signal<Tag[]>([]);
  readonly open       = signal(false);

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

  isApplied(tag: Tag): boolean {
    return this.entityTags.some(t => t.publicId === tag.publicId);
  }

  select(tag: Tag): void {
    this.tagAdded.emit(tag);
    this.query.set('');
    this.open.set(false);
  }

  remove(tag: Tag): void {
    this.tagRemoved.emit(tag);
  }

  createAndAdd(): void {
    const name = this.query().trim();
    if (!name) return;
    this.api.create({ name }).subscribe(tag => {
      this.allTags.update(list => [...list, tag].sort((a, b) => a.name.localeCompare(b.name)));
      this.select(tag);
    });
  }

  get canCreate(): boolean {
    const q = this.query().trim().toLowerCase();
    return q.length > 0 && !this.allTags().some(t => t.name.toLowerCase() === q);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.host.nativeElement.contains(e.target)) this.open.set(false);
  }
}
