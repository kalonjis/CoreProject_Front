import { Component, Input, OnChanges, inject } from '@angular/core';
import { InteractionFacade }          from '../../facades/interaction.facade';
import { InteractionTimelineComponent } from '../../components/interaction-timeline/interaction-timeline.component';

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
