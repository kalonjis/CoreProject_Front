import { Injectable, inject, signal } from '@angular/core';
import { CrmInteractionApiService } from '../services/crm-interaction-api.service';
import { CrmTimelineApiService }    from '../../timeline/services/crm-timeline-api.service';
import { FeedbackService }          from '../../../../../shared/feedback/tools/feedback.service';
import { TimelineEntryResponse }    from '../../timeline/models/timeline.model';

type InteractionContext = { type: 'deal' | 'contact' | 'lead'; publicId: string };

@Injectable()
export class InteractionFacade {

  private readonly interactionApi = inject(CrmInteractionApiService);
  private readonly timelineApi    = inject(CrmTimelineApiService);
  private readonly feedback       = inject(FeedbackService);

  private readonly _entries  = signal<TimelineEntryResponse[]>([]);
  private readonly _loading  = signal(false);
  private readonly _context  = signal<InteractionContext | null>(null);

  readonly entries  = this._entries.asReadonly();
  readonly loading  = this._loading.asReadonly();

  loadFor(type: InteractionContext['type'], publicId: string): void {
    this._context.set({ type, publicId });
    this.load();
  }

  refresh(): void {
    this.load();
  }

  deleteInteraction(publicId: string): void {
    this.interactionApi.delete(publicId).subscribe({
      next:  () => this.load(),
      error: () => this.feedback.showError('Suppression impossible.')
    });
  }

  private load(): void {
    const ctx = this._context();
    if (!ctx) return;

    this._loading.set(true);

    const obs$ = ctx.type === 'deal'
      ? this.timelineApi.getTimelineByDeal(ctx.publicId)
      : ctx.type === 'contact'
        ? this.timelineApi.getTimelineByContact(ctx.publicId)
        : this.timelineApi.getTimelineByLead(ctx.publicId);

    obs$.subscribe({
      next:  items => { this._entries.set(items); this._loading.set(false); },
      error: ()    => { this._loading.set(false); this.feedback.showError('Chargement du timeline impossible.'); }
    });
  }
}
