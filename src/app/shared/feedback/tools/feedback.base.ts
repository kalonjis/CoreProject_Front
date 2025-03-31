// src/app/shared/feedback/tools/feedback.base.ts
import { signal } from '@angular/core';
import { FeedbackType } from './feedback.model';

/**
 * Classe utilitaire qui peut être étendue par un composant pour intégrer
 * facilement des fonctionnalités de feedback à l'utilisateur.
 */
export class FeedbackBase {
  // Signaux pour gérer l'état du feedback
  feedbackMessage = signal<string>('');
  feedbackType = signal<FeedbackType>('info');
  showFeedback = signal<boolean>(false);
  buttonText = signal<string>('');
  feedbackTimeout = signal<number | null>(null);

  // Fonction à exécuter lorsque le bouton est cliqué
  buttonAction: () => void = () => {};

  /**
   * Affiche un message de feedback
   * @param type Type de feedback (success, error, warning, info)
   * @param message Le message à afficher
   * @param buttonText Texte du bouton (optionnel)
   * @param timeout Délai avant disparition automatique (optionnel)
   */
  displayFeedback(type: FeedbackType, message: string, buttonText: string = '', timeout: number | null = null) {
    this.showFeedback.set(true);
    this.feedbackType.set(type);
    this.feedbackMessage.set(message);
    this.buttonText.set(buttonText);
    this.feedbackTimeout.set(timeout);
  }

  /**
   * Affiche un message de succès
   */
  displaySuccess(message: string, buttonText: string = '', timeout: number | null = 5000) {
    this.displayFeedback('success', message, buttonText, timeout);
  }

  /**
   * Affiche un message d'erreur
   */
  displayError(message: string, buttonText: string = '', timeout: number | null = null) {
    this.displayFeedback('error', message, buttonText, timeout);
  }

  /**
   * Affiche un message d'information
   */
  displayInfo(message: string, buttonText: string = '', timeout: number | null = 5000) {
    this.displayFeedback('info', message, buttonText, timeout);
  }

  /**
   * Affiche un message d'avertissement
   */
  displayWarning(message: string, buttonText: string = '', timeout: number | null = 7000) {
    this.displayFeedback('warning', message, buttonText, timeout);
  }

  /**
   * Efface le message de feedback
   */
  clearFeedback() {
    this.showFeedback.set(false);
  }

  /**
   * Gestionnaire pour le clic sur le bouton de feedback
   */
  handleFeedbackButtonClick() {
    if (this.buttonAction) {
      this.buttonAction();
    }
    this.clearFeedback();
  }
}
