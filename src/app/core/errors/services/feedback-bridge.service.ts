
import { Injectable, inject, signal } from '@angular/core';
import { GlobalErrorManagerService } from './global-error-manager.service';
import { HttpErrorContext } from '../models/http-error-context';

export interface FeedbackMessage {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  buttonText?: string;
  timeout?: number;
  actions?: Array<{
    label: string;
    callback: () => void;
    style?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackBridgeService {

  private globalErrorManager = inject(GlobalErrorManagerService);

  // Signal pour le feedback actuel
  private currentFeedback = signal<FeedbackMessage | null>(null);

  // Signal en lecture seule pour les composants
  public readonly feedback = this.currentFeedback.asReadonly();

  /**
   * MÉTHODE PRINCIPALE : Traiter une erreur HTTP
   * Les composants appellent cette méthode directement
   */
  handleHttpError(context: HttpErrorContext): void {
    if (context.action === 'feedback' || context.action === 'inline') {
      this.convertContextToFeedback(context);
    }
    // Pour les autres actions (redirect, modal, etc.), les laisser au GlobalErrorManager
  }

  /**
   * Convertir un contexte d'erreur en message de feedback
   */
  private convertContextToFeedback(context: HttpErrorContext): void {
    const feedbackMessage: FeedbackMessage = {
      message: context.message || 'Une erreur est survenue',
      type: context.feedbackType || this.getDefaultFeedbackType(context),
      timeout: context.feedbackDuration || this.getDefaultTimeout(context),
      buttonText: this.getDefaultButtonText(context),
      actions: this.convertActionsToFeedback(context)
    };

    this.currentFeedback.set(feedbackMessage);
  }

  /**
   * Afficher un feedback personnalisé (pour usage direct dans les composants)
   */
  showFeedback(message: FeedbackMessage): void {
    this.currentFeedback.set(message);
  }

  /**
   * Effacer le feedback actuel
   */
  clearFeedback(): void {
    this.currentFeedback.set(null);
  }

  /**
   * Méthodes de convenance pour les composants existants
   */
  displayError(message: string, buttonText?: string, timeout?: number): void {
    this.showFeedback({
      message,
      type: 'error',
      buttonText: buttonText || 'OK',
      timeout: timeout || 0
    });
  }

  displayWarning(message: string, buttonText?: string, timeout?: number): void {
    this.showFeedback({
      message,
      type: 'warning',
      buttonText: buttonText || 'J\'ai compris',
      timeout: timeout || 8000
    });
  }

  displaySuccess(message: string, buttonText?: string, timeout?: number): void {
    this.showFeedback({
      message,
      type: 'success',
      buttonText: buttonText || 'OK',
      timeout: timeout || 5000
    });
  }

  displayInfo(message: string, buttonText?: string, timeout?: number): void {
    this.showFeedback({
      message,
      type: 'info',
      buttonText: buttonText || 'OK',
      timeout: timeout || 5000
    });
  }

  // Méthodes utilitaires (identiques à la version précédente)
  private getDefaultFeedbackType(context: HttpErrorContext): 'error' | 'warning' | 'info' | 'success' {
    switch (context.statusCode) {
      case 400:
      case 422:
        return 'warning';
      case 401:
      case 403:
        return 'warning';
      case 404:
        return 'info';
      case 409:
        return 'warning';
      case 429:
        return 'info';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'error';
      default:
        return 'error';
    }
  }

  private getDefaultTimeout(context: HttpErrorContext): number {
    switch (context.statusCode) {
      case 401:
        return 0;
      case 403:
        return 8000;
      case 404:
        return 6000;
      case 422:
        return 0;
      case 500:
      case 502:
      case 503:
      case 504:
        return 10000;
      default:
        return 5000;
    }
  }

  private getDefaultButtonText(context: HttpErrorContext): string {
    if (context.canRetry) {
      return 'Réessayer';
    }

    switch (context.statusCode) {
      case 401:
        return 'Se connecter';
      case 403:
        return 'J\'ai compris';
      case 404:
        return 'Retour';
      case 422:
        return 'Corriger';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Signaler';
      default:
        return 'OK';
    }
  }

  private convertActionsToFeedback(context: HttpErrorContext): Array<{
    label: string;
    callback: () => void;
    style?: string;
  }> | undefined {
    if (!context.customActions) return undefined;

    return context.customActions.map(action => ({
      label: action.label,
      callback: action.action,
      style: this.mapActionStyleToFeedback(action.style)
    }));
  }

  private mapActionStyleToFeedback(style: string): string {
    switch (style) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'btn-warning';
      case 'success':
        return 'btn-success';
      default:
        return 'btn-primary';
    }
  }
}
