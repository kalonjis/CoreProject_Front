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
  @Input({ required: true }) entries: TimelineEntryResponse[] = [];
  @Input() loading = false;
  @Output() deleteRequested = new EventEmitter<string>();

  readonly toDisplayType = toDisplayType;

  isDeletable(entry: TimelineEntryResponse): boolean {
    return entry.sourceType === 'INTERACTION'
        && entry.interactionType !== InteractionType.CONTACT_FORM;
  }
}
