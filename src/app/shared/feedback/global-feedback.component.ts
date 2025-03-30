// src/app/shared/feedback/global-feedback.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedbackComponent } from './feedback.component';
import { FeedbackService } from './tools/feedback.service';

/**
 * Composant permettant d'afficher des messages de feedback globaux dans l'application.
 * À placer dans app.component.html pour des notifications accessibles depuis n'importe où.
 */
@Component({
  selector: 'app-global-feedback',
  standalone: true,
  imports: [CommonModule, FeedbackComponent],
  template: `
    @if (feedbackService.feedback()) {
      <app-feedback
        [message]="feedbackService.feedback()?.message ?? ''"
        [type]="feedbackService.feedback()?.type ?? 'info'"
        [buttonText]="feedbackService.feedback()?.buttonText ?? ''"
        [timeout]="feedbackService.feedback()?.timeout ?? null"
        (buttonClicked)="onButtonClicked()"
      ></app-feedback>
    }
  `
})
export class GlobalFeedbackComponent {
  feedbackService = inject(FeedbackService);

  onButtonClicked() {
    this.feedbackService.clearFeedback();
  }
}
