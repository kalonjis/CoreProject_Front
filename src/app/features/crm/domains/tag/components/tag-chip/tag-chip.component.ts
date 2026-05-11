import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Tag } from '../../models/tag.model';

@Component({
  selector: 'app-tag-chip',
  imports: [],
  templateUrl: './tag-chip.component.html',
  styleUrl: './tag-chip.component.scss'
})
/** Colour-coded chip rendering a tag, with optional remove button and navigation to the tag detail page. */
export class TagChipComponent {
  /** The tag to render. */
  @Input({ required: true }) tag!: Tag;
  /** When true, a remove (×) button is shown inside the chip. */
  @Input() removable  = false;
  /** When true, clicking the chip navigates to the tag detail page. */
  @Input() navigable  = false;
  /** Emits the tag when the remove button is clicked. */
  @Output() removed = new EventEmitter<Tag>();

  private readonly router = inject(Router);

  /** Navigates to the tag detail page if navigable is true. */
  navigate(): void {
    if (this.navigable) this.router.navigate(['/crm/tags', this.tag.publicId]);
  }

  /** Returns a dark or light foreground colour for readability against the tag's background. */
  get textColor(): string {
    return this.isLight(this.tag.color) ? '#1a1a2e' : '#ffffff';
  }

  private isLight(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
}
