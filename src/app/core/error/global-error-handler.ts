import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environment/environment';

/**
 * Gestionnaire global d'erreurs pour l'application
 * Capture et traite toutes les erreurs non gérées
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private router = inject(Router);

  handleError(error: Error | HttpErrorResponse): void {
    let errorMessage: string;
    let stackTrace: string | undefined;

    if (error instanceof HttpErrorResponse) {
      // Erreur HTTP provenant du serveur ou d'une connexion réseau
      errorMessage = this.getServerErrorMessage(error);
      stackTrace = undefined; // Les erreurs HTTP n'ont généralement pas de stacktrace
    } else {
      // Erreur client-side JS
      errorMessage = this.getClientErrorMessage(error);
      stackTrace = error.stack;

      // Redirection vers une page d'erreur pour les erreurs fatales
      if (this.isFatalError(error)) {
        this.router.navigate(['/error'], {
          queryParams: {
            errorId: this.generateErrorId()
          }
        });
      }
    }

    // Log l'erreur à la console (en développement)
    this.logError(errorMessage, stackTrace);

    // En production, on pourrait envoyer l'erreur à un service de monitoring
    if (environment.production) {
      this.reportErrorToMonitoringService(errorMessage, stackTrace);
    }
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return `Error: ${error.error.message}`;
    }
    return error.error?.message || `Error Code: ${error.status}, Message: ${error.message}`;
  }

  private getClientErrorMessage(error: Error): string {
    return error.message ? error.message : error.toString();
  }

  private isFatalError(error: Error): boolean {
    // Logique pour déterminer si une erreur est fatale pour l'application
    // Par exemple, les erreurs qui empêchent le chargement d'un composant principal
    return error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Cannot read property') ||
      error.message?.includes('undefined is not an object');
  }

  private generateErrorId(): string {
    // Génère un ID unique pour l'erreur (pour le support)
    return Math.random().toString(36).substring(2, 15);
  }

  private logError(message: string, stack?: string): void {
    console.error(`🚨 ERROR: ${message}`);
    if (stack) {
      console.error(`STACK: ${stack}`);
    }
  }

  private reportErrorToMonitoringService(message: string, stack?: string): void {
    // Intégration avec un service de monitoring comme Sentry, LogRocket, etc.
    // À implémenter selon les besoins
    // API fictive d'envoi d'erreur
    /*
    monitoringService.captureError({
      message,
      stack,
      timestamp: new Date().toISOString(),
      userInfo: this.authService.user ? {
        id: this.authService.user.id,
        username: this.authService.user.username
      } : undefined,
      url: window.location.href
    });
    */
  }
}
