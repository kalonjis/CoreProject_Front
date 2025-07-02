import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpErrorType, HttpErrorSubType } from '../types/http-error-type';
import { HttpErrorContext } from '../models/http-error-context';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorAnalyzerService {

  private authService = inject(AuthService);

  analyze(error: HttpErrorResponse, url: string = ''): HttpErrorContext {
    const baseContext: HttpErrorContext = {
      type: this.getErrorType(error.status),
      statusCode: error.status,
      action: 'feedback', // Défaut
      timestamp: new Date(),
      url: url || error.url || '',
      message: this.extractErrorMessage(error)
    };

    // Analyse spécifique par code de statut
    switch (error.status) {
      case 0:
        return this.analyzeNetworkError(error, baseContext);
      case 400:
        return this.analyzeBadRequest(error, baseContext);
      case 401:
        return this.analyzeUnauthorized(error, baseContext);
      case 403:
        return this.analyzeForbidden(error, baseContext);
      case 404:
        return this.analyzeNotFound(error, baseContext);
      case 409:
        return this.analyzeConflict(error, baseContext);
      case 422:
        return this.analyzeValidationError(error, baseContext);
      case 429:
        return this.analyzeRateLimit(error, baseContext);
      case 500:
        return this.analyzeInternalServerError(error, baseContext);
      case 502:
        return this.analyzeBadGateway(error, baseContext);
      case 503:
        return this.analyzeServiceUnavailable(error, baseContext);
      case 504:
        return this.analyzeGatewayTimeout(error, baseContext);
      default:
        return this.analyzeUnknownError(error, baseContext);
    }
  }

  private getErrorType(status: number): HttpErrorType {
    switch (status) {
      case 0: return HttpErrorType.NETWORK_ERROR;
      case 400: return HttpErrorType.BAD_REQUEST;
      case 401: return HttpErrorType.UNAUTHORIZED;
      case 403: return HttpErrorType.FORBIDDEN;
      case 404: return HttpErrorType.NOT_FOUND;
      case 409: return HttpErrorType.CONFLICT;
      case 422: return HttpErrorType.VALIDATION_ERROR;
      case 429: return HttpErrorType.RATE_LIMITED;
      case 500: return HttpErrorType.INTERNAL_SERVER_ERROR;
      case 502: return HttpErrorType.BAD_GATEWAY;
      case 503: return HttpErrorType.SERVICE_UNAVAILABLE;
      case 504: return HttpErrorType.GATEWAY_TIMEOUT;
      default: return HttpErrorType.UNKNOWN;
    }
  }

  private analyzeNetworkError(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      subType: HttpErrorSubType.CONNECTION_REFUSED,
      action: 'modal',
      title: 'Problème de connexion',
      message: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
      canRetry: true,
      retryDelay: 3000,
      maxRetries: 3,
      feedbackType: 'error'
    };
  }

  private analyzeBadRequest(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      action: 'feedback',
      title: 'Requête invalide',
      message: 'Les données envoyées sont incorrectes.',
      feedbackType: 'error',
      showDetails: true
    };
  }

  private analyzeUnauthorized(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      subType: HttpErrorSubType.AUTHENTICATION_REQUIRED,
      action: 'redirect',
      destination: '/auth/login',
      message: 'Votre session a expiré. Veuillez vous reconnecter.'
    };
  }

  private analyzeForbidden(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    const errorMessage = error.error?.error || '';

    // Analyser le type de forbidden
    if (!this.authService.isAuthenticated()) {
      return {
        ...base,
        subType: HttpErrorSubType.AUTHENTICATION_REQUIRED,
        action: 'redirect',
        destination: '/auth/login'
      };
    }

    if (errorMessage.includes('suspended') || errorMessage.includes('disabled by administrator')) {
      return {
        ...base,
        subType: HttpErrorSubType.ACCOUNT_SUSPENDED,
        action: 'page',
        destination: '/account-status',
        title: 'Compte suspendu',
        message: 'Votre compte a été suspendu par un administrateur.'
      };
    }

    // CORRECTION: Utiliser base.url || '' pour éviter undefined
    if (this.isPrivilegeError(base.url || '', errorMessage)) {
      return {
        ...base,
        subType: HttpErrorSubType.INSUFFICIENT_PRIVILEGES,
        action: 'feedback', // Laisser le composant gérer avec le feedback
        title: 'Droits insuffisants',
        message: this.getPrivilegeErrorMessage(errorMessage),
        feedbackType: 'warning'
      };
    }

    return {
      ...base,
      action: 'feedback',
      title: 'Accès refusé',
      message: 'Vous n\'avez pas les autorisations nécessaires.',
      feedbackType: 'error'
    };
  }

  private analyzeNotFound(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    // CORRECTION: Utiliser base.url || '' pour éviter undefined
    const url = base.url || '';

    // Différencier API vs Page
    if (url.includes('/api/')) {
      return {
        ...base,
        subType: HttpErrorSubType.API_ENDPOINT_NOT_FOUND,
        action: 'feedback',
        title: 'Ressource introuvable',
        message: 'La ressource demandée n\'existe pas ou a été supprimée.',
        feedbackType: 'warning'
      };
    }

    return {
      ...base,
      subType: HttpErrorSubType.PAGE_NOT_FOUND,
      action: 'page',
      destination: '/error/404',
      title: 'Page introuvable',
      message: 'La page que vous cherchez n\'existe pas.'
    };
  }

  private analyzeConflict(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      action: 'feedback',
      title: 'Conflit de données',
      message: 'Cette action ne peut pas être effectuée car elle entre en conflit avec des données existantes.',
      feedbackType: 'warning',
      showDetails: true
    };
  }

  private analyzeValidationError(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      action: 'feedback',
      title: 'Données invalides',
      message: 'Veuillez corriger les erreurs dans le formulaire.',
      feedbackType: 'warning',
      showDetails: true
    };
  }

  private analyzeRateLimit(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    const retryAfter = this.extractRetryDelay(error);
    return {
      ...base,
      action: 'modal',
      title: 'Limite de requêtes atteinte',
      message: `Trop de tentatives. Veuillez patienter ${retryAfter} secondes.`,
      canRetry: true,
      retryDelay: retryAfter * 1000,
      feedbackType: 'warning'
    };
  }

  private analyzeInternalServerError(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      action: 'modal',
      title: 'Erreur serveur',
      message: 'Une erreur interne est survenue. Nous travaillons à la résoudre.',
      canRetry: true,
      retryDelay: 5000,
      maxRetries: 2,
      feedbackType: 'error',
      customActions: [
        {
          label: 'Signaler le problème',
          // CORRECTION: Retourner void explicitement
          action: () => {
            window.open('mailto:support@votreapp.com', '_blank');
          },
          style: 'secondary',
          icon: '📧'
        }
      ]
    };
  }

  private analyzeBadGateway(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      action: 'banner',
      title: 'Service temporairement indisponible',
      message: 'Nos serveurs sont en maintenance. Réessayez dans quelques minutes.',
      canRetry: true,
      retryDelay: 30000,
      feedbackType: 'warning'
    };
  }

  private analyzeServiceUnavailable(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      action: 'page',
      destination: '/maintenance',
      title: 'Maintenance en cours',
      message: 'Le service est temporairement indisponible pour maintenance.'
    };
  }

  private analyzeGatewayTimeout(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      action: 'modal',
      title: 'Délai d\'attente dépassé',
      message: 'Le serveur met trop de temps à répondre. Veuillez réessayer.',
      canRetry: true,
      retryDelay: 3000,
      maxRetries: 2,
      feedbackType: 'warning'
    };
  }

  private analyzeUnknownError(error: HttpErrorResponse, base: HttpErrorContext): HttpErrorContext {
    return {
      ...base,
      action: 'feedback',
      title: 'Erreur inattendue',
      message: 'Une erreur inattendue est survenue.',
      feedbackType: 'error',
      canRetry: true
    };
  }

  // Méthodes utilitaires (reprises et adaptées)
  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.error) return error.error.error;
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return 'Une erreur est survenue';
  }

  private isPrivilegeError(url: string, errorMessage: string): boolean {
    const privilegeKeywords = ['privileges', 'rights', 'permissions', 'super_admin', 'unauthorized'];
    const actionUrls = ['/deactivate/', '/delete/', '/grant-role/', '/revoke-role/', '/admin/'];

    return actionUrls.some(actionUrl => url.toLowerCase().includes(actionUrl)) &&
      privilegeKeywords.some(keyword => errorMessage.toLowerCase().includes(keyword));
  }

  private getPrivilegeErrorMessage(errorMessage: string): string {
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('super_admin') || lowerMessage.includes('super admin')) {
      return 'Seul un Super Administrateur peut effectuer cette action';
    }
    if (lowerMessage.includes('own account')) {
      return 'Vous ne pouvez pas effectuer cette action sur votre propre compte';
    }
    if (lowerMessage.includes('role')) {
      return 'Vous n\'avez pas le rôle requis pour cette action';
    }

    return 'Vous n\'avez pas les droits suffisants pour cette action';
  }

  private extractRetryDelay(error: HttpErrorResponse): number {
    const retryAfter = error.headers?.get('Retry-After');
    if (retryAfter) {
      const delay = parseInt(retryAfter, 10);
      return isNaN(delay) ? 60 : delay;
    }
    return 60;
  }
}
