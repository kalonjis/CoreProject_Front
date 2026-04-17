/**
 * Shared assignee cell used across CRM list and detail views.
 *
 * Renders either:
 *  - compact mode (list rows): a static avatar when assigned, or a clickable amber
 *    badge when unassigned.
 *  - full mode (info cards): a clickable avatar + name + edit icon when assigned,
 *    or an amber badge when unassigned.
 *
 * The component manages its own open/close state via ElementRef containment checks.
 * The parent is responsible for loading `commercials` and reacting to `selected`.
 */
import { Component, Input, Output, EventEmitter, signal, inject, ElementRef, HostListener } from '@angular/core';
import { CommercialSummary, commercialDisplayName } from '../../models/commercial.model';

@Component({
  selector: 'app-crm-assign-popover',
  imports: [],
  templateUrl: './crm-assign-popover.component.html',
  styleUrl: './crm-assign-popover.component.scss'
})
export class CrmAssignPopoverComponent {
  /** Display name of the current assignee, or null if unassigned. */
  @Input() assigneeName: string | null = null;
  /** List of available commercials to pick from. */
  @Input() commercials: CommercialSummary[] = [];
  /**
   * Compact mode for list rows:
   *  - true  → assigned shows avatar only (not clickable); unassigned shows amber badge.
   *  - false → full trigger (avatar + name + edit icon) when assigned; badge when not.
   */
  @Input() compact = false;
  /** Whether to animate the unassigned badge (for overdue items). */
  @Input() pulse = false;

  @Output() selected = new EventEmitter<CommercialSummary>();

  private readonly el = inject(ElementRef);
  readonly open = signal(false);
  readonly displayName = commercialDisplayName;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  toggle(): void { this.open.update(v => !v); }

  select(c: CommercialSummary): void {
    this.open.set(false);
    this.selected.emit(c);
  }

  assigneeInitials(name: string): string {
    const parts = name.split('.');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  commercialInitials(c: CommercialSummary): string {
    const f = c.firstName?.[0] ?? '';
    const l = c.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || c.username.substring(0, 2).toUpperCase();
  }
}
