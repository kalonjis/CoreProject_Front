/**
 * Renders a chronological timeline of CRM interactions and completed commercial actions.
 *
 * Accepts a flat list of {@link TimelineEntryResponse} items (interactions and
 * completed commercial actions) and renders them as an expandable timeline.
 * Supports inline deletion of deletable interaction entries.
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TimelineEntryResponse, toDisplayType } from '../../../timeline/models/timeline.model';
import { InteractionType }                       from '../../models/interaction.model';
import { InteractionTypeBadgeComponent }         from '../interaction-type-badge/interaction-type-badge.component';
import { InteractionOutcomeBadgeComponent }      from '../interaction-outcome-badge/interaction-outcome-badge.component';

@Component({
  selector: 'app-interaction-timeline',
  imports: [DatePipe, InteractionTypeBadgeComponent, InteractionOutcomeBadgeComponent],
  templateUrl: './interaction-timeline.component.html',
  styleUrl: './interaction-timeline.component.scss'
})
export class InteractionTimelineComponent {
  /** Timeline entries to display, ordered by occurredAt descending. */
  @Input({ required: true }) entries: TimelineEntryResponse[] = [];

  /** Whether the parent is currently loading entries. Shows a skeleton when true. */
  @Input() loading = false;

  /** Emits the publicId of the interaction the user wants to delete. */
  @Output() deleteRequested = new EventEmitter<string>();

  readonly toDisplayType = toDisplayType;

  private readonly expandedIds = new Set<string>();

  /**
   * Returns true when the entry can be deleted by the user.
   * CONTACT_FORM interactions and commercial action entries are read-only.
   *
   * @param entry the timeline entry to evaluate
   */
  isDeletable(entry: TimelineEntryResponse): boolean {
    return entry.sourceType === 'INTERACTION'
        && entry.interactionType !== InteractionType.CONTACT_FORM;
  }

  /**
   * Toggles the expanded state of the given timeline entry.
   *
   * @param publicId the public identifier of the entry to toggle
   */
  toggleExpand(publicId: string): void {
    if (this.expandedIds.has(publicId)) {
      this.expandedIds.delete(publicId);
    } else {
      this.expandedIds.add(publicId);
    }
  }

  /**
   * Returns true when the given entry is currently expanded.
   *
   * @param publicId the public identifier of the entry to check
   */
  isExpanded(publicId: string): boolean {
    return this.expandedIds.has(publicId);
  }
}
