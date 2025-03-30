// src/app/shared/feedback/services/feedback.service.ts
import { Injectable, signal } from '@angular/core';
import {FeedbackOptions} from './feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  // État global du feedback
  private _feedback = signal<FeedbackOptions | null>(null);

  // Signal en lecture seule pour les composants
  readonly feedback = this._feedback.asReadonly();

  /**
   * Affiche un message de feedback
   */
  showFeedback(options: FeedbackOptions) {
    this._feedback.set(options);
  }

  /**
   * Affiche un message de succès
   */
  showSuccess(message: string, buttonText?: string, timeout: number | null = 5000) {
    this.showFeedback({
      message,
      type: 'success',
      buttonText,
      timeout
    });
  }

  /**
   * Affiche un message d'erreur
   */
  showError(message: string, buttonText?: string, timeout: number | null = null) {
    this.showFeedback({
      message,
      type: 'error',
      buttonText,
      timeout
    });
  }

  /**
   * Affiche un message d'information
   */
  showInfo(message: string, buttonText?: string, timeout: number | null = 5000) {
    this.showFeedback({
      message,
      type: 'info',
      buttonText,
      timeout
    });
  }

  /**
   * Affiche un message d'avertissement
   */
  showWarning(message: string, buttonText?: string, timeout: number | null = 7000) {
    this.showFeedback({
      message,
      type: 'warning',
      buttonText,
      timeout
    });
  }

  /**
   * Efface le message de feedback
   */
  clearFeedback() {
    this._feedback.set(null);
  }
}
