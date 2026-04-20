/**
 * Embeddable page/section that displays the interaction timeline for a given CRM entity.
 *
 * Delegates data loading to {@link InteractionFacade} via {@link contextType} and
 * {@link contextId}. Automatically reloads when either input changes.
 */
import { Component, Input, OnChanges, inject } from '@angular/core';
import { InteractionFacade }          from '../../facades/interaction.facade';
import { InteractionTimelineComponent } from '../../components/interaction-timeline/interaction-timeline.component';

/** The type of CRM entity that owns the interaction timeline. */
type InteractionContext = 'deal' | 'contact' | 'lead';

@Component({
  selector: 'app-interaction-list',
  imports: [InteractionTimelineComponent],
  templateUrl: './interaction-list.component.html',
  styleUrl: './interaction-list.component.scss'
})
export class InteractionListComponent implements OnChanges {
  @Input({ required: true }) contextType!: InteractionContext;
  @Input({ required: true }) contextId!:   string;

  readonly facade = inject(InteractionFacade);

  ngOnChanges(): void {
    this.facade.loadFor(this.contextType, this.contextId);
  }
}
