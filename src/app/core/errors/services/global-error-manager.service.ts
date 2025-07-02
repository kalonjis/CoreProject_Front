import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorContext, HttpErrorAction } from '../models/http-error-context';
import { HttpErrorType } from '../types/http-error-type';

export interface GlobalModal {
  isVisible: boolean;
  context: HttpErrorContext | null;
  retryCount: number;
}

export interface GlobalBanner {
  isVisible: boolean;
  context: HttpErrorContext | null;
  id: string;
}

export interface GlobalFeedback {
  isVisible: boolean;
  context: HttpErrorContext | null;
  componentId?: string; // Pour cibler un composant spécifique
}

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorManagerService {

  private router = inject(Router);

  // Signaux pour les différents types d'affichage
  private modalSignal = signal<GlobalModal>({
    isVisible: false,
    context: null,
    retryCount: 0
  });

  private bannerSignal = signal<GlobalBanner>({
    isVisible: false,
    context: null,
    id: ''
  });

  private feedbackSignal = signal<GlobalFeedback>({
    isVisible: false,
    context: null
  });

  // CORRECTION: Utiliser number au lieu de NodeJS.Timeout
  private retryTimeoutSignal = signal<number | null>(null);

  // Signaux en lecture seule pour les composants
  public readonly modal = this.modalSignal.asReadonly();
  public readonly banner = this.bannerSignal.asReadonly();
  public readonly feedback = this.feedbackSignal.asReadonly();

  // Signaux computés pour la logique
  public readonly hasActiveError = computed(() =>
    this.modalSignal().isVisible ||
    this.bannerSignal().isVisible ||
    this.feedbackSignal().isVisible
  );

  public readonly retryCountdown = computed(() => {
    const modal = this.modalSignal();
    if (modal.isVisible && modal.context?.canRetry && modal.context.retryDelay) {
      return Math.ceil(modal.context.retryDelay / 1000);
    }
    return 0;
  });

  /**
   * Point d'entrée principal pour gérer une erreur
   */
  handleError(context: HttpErrorContext): void {
    switch (context.action) {
      case 'redirect':
        this.handleRedirect(context);
        break;

      case 'modal':
        this.showModal(context);
        break;

      case 'banner':
        this.showBanner(context);
        break;

      case 'feedback':
        this.showFeedback(context);
        break;

      case 'page':
        this.navigateToErrorPage(context);
        break;

      case 'retry':
        this.handleAutoRetry(context);
        break;

      default:
        console.warn('Action non reconnue pour l\'erreur:', context.action);
        // Fallback vers feedback
        this.showFeedback(context);
    }
  }

  /**
   * Afficher une modal d'erreur
   */
  private showModal(context: HttpErrorContext): void {
    this.clearRetryTimeout();

    this.modalSignal.set({
      isVisible: true,
      context,
      retryCount: 0
    });

    // Auto-retry si configuré
    if (context.canRetry && context.retryDelay) {
      this.setupAutoRetry(context);
    }
  }

  /**
   * Afficher un banner d'erreur
   */
  private showBanner(context: HttpErrorContext): void {
    const id = `banner-${Date.now()}`;

    this.bannerSignal.set({
      isVisible: true,
      context,
      id
    });

    // Auto-dismiss si configuré
    if (context.feedbackDuration && context.feedbackDuration > 0) {
      setTimeout(() => {
        this.dismissBanner();
      }, context.feedbackDuration);
    }
  }

  /**
   * Déclencher le feedback (pour integration avec le feedback component existant)
   */
  private showFeedback(context: HttpErrorContext, componentId?: string): void {
    this.feedbackSignal.set({
      isVisible: true,
      context,
      componentId
    });

    // Le feedback sera géré par le composant qui l'utilise
    // On emit juste le signal pour qu'il puisse réagir
  }

  /**
   * Redirection avec query params
   */
  private handleRedirect(context: HttpErrorContext): void {
    if (!context.destination) {
      console.error('Destination manquante pour la redirection');
      return;
    }

    const navigationExtras: any = {};

    // Ajouter des query params selon le type d'erreur
    if (context.type === HttpErrorType.UNAUTHORIZED) {
      navigationExtras.queryParams = {
        returnUrl: this.router.url,
        reason: 'session_expired'
      };
    } else if (context.type === HttpErrorType.FORBIDDEN) {
      navigationExtras.queryParams = {
        reason: context.subType,
        from: this.router.url
      };
    }

    this.router.navigate([context.destination], navigationExtras);
  }

  /**
   * Navigation vers page d'erreur dédiée
   */
  private navigateToErrorPage(context: HttpErrorContext): void {
    const destination = context.destination || this.getDefaultErrorPage(context);

    this.router.navigate([destination], {
      state: {
        errorContext: context,
        canGoBack: true
      }
    });
  }

  /**
   * Gestion du retry automatique
   */
  private handleAutoRetry(context: HttpErrorContext): void {
    if (!context.canRetry || !context.retryDelay) {
      this.showFeedback(context);
      return;
    }

    this.showModal({
      ...context,
      title: 'Reconnexion en cours...',
      message: `Nouvelle tentative dans ${Math.ceil(context.retryDelay / 1000)} secondes`
    });

    this.setupAutoRetry(context);
  }

  /**
   * Configuration du retry automatique
   */
  private setupAutoRetry(context: HttpErrorContext): void {
    if (!context.retryDelay) return;

    // CORRECTION: Utiliser window.setTimeout qui retourne number
    const timeout = window.setTimeout(() => {
      const current = this.modalSignal();
      if (current.context?.canRetry) {
        this.executeRetry(current.context);
      }
    }, context.retryDelay);

    this.retryTimeoutSignal.set(timeout);
  }

  /**
   * Exécuter le retry
   */
  private executeRetry(context: HttpErrorContext): void {
    const currentModal = this.modalSignal();
    const newRetryCount = currentModal.retryCount + 1;

    // Vérifier le nombre max de retries
    if (context.maxRetries && newRetryCount > context.maxRetries) {
      this.closeModal();
      this.showFeedback({
        ...context,
        title: 'Échec de reconnexion',
        message: 'Impossible de résoudre le problème automatiquement.',
        canRetry: false
      });
      return;
    }

    // Mettre à jour le compteur
    this.modalSignal.update(modal => ({
      ...modal,
      retryCount: newRetryCount
    }));

    // Ici vous pourriez déclencher une action de retry
    // Par exemple, refaire la requête HTTP originale
    console.log('Retry attempt:', newRetryCount);

    // Pour l'exemple, on ferme la modal après le retry
    setTimeout(() => {
      this.closeModal();
    }, 1000);
  }

  /**
   * Fermer la modal
   */
  closeModal(): void {
    this.clearRetryTimeout();
    this.modalSignal.set({
      isVisible: false,
      context: null,
      retryCount: 0
    });
  }

  /**
   * Dismisser le banner
   */
  dismissBanner(): void {
    this.bannerSignal.set({
      isVisible: false,
      context: null,
      id: ''
    });
  }

  /**
   * Fermer le feedback
   */
  closeFeedback(): void {
    this.feedbackSignal.set({
      isVisible: false,
      context: null
    });
  }

  /**
   * Nettoyer les timeouts
   */
  private clearRetryTimeout(): void {
    const timeout = this.retryTimeoutSignal();
    if (timeout) {
      // CORRECTION: Utiliser window.clearTimeout
      window.clearTimeout(timeout);
      this.retryTimeoutSignal.set(null);
    }
  }

  /**
   * Obtenir la page d'erreur par défaut selon le type
   */
  private getDefaultErrorPage(context: HttpErrorContext): string {
    switch (context.type) {
      case HttpErrorType.NOT_FOUND:
        return '/error/404';
      case HttpErrorType.FORBIDDEN:
        return '/error/403';
      case HttpErrorType.INTERNAL_SERVER_ERROR:
        return '/error/500';
      case HttpErrorType.SERVICE_UNAVAILABLE:
        return '/maintenance';
      default:
        return '/error/generic';
    }
  }

  /**
   * Nettoyer tous les états d'erreur
   */
  clearAll(): void {
    this.closeModal();
    this.dismissBanner();
    this.closeFeedback();
  }
}
