import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { httpErrorInterceptor } from '../core/http/http-error-interceptor';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { SessionService } from '../core/auth/services/session.service';
import { authInterceptor } from '../core/http/auth-interceptor';
import { environment } from '../../environment/environment';
import { GlobalErrorHandler } from '../core/error/global-error-handler';
import { ContentSecurityService } from '../core/security/content-security.service';

// Fonction d'initialisation de la sécurité
function initSecurityFeatures(contentSecurityService: ContentSecurityService) {
  return () => {
    // Configurer la politique CSP
    if (environment.production) {
      contentSecurityService.setupStrictCsp();
    }
    return Promise.resolve();
  };
}

// Fonction d'initialisation de la session
function initializeApp(sessionService: SessionService) {
  return () => {
    console.log("Initializing session...");
    return sessionService.initialize().then(() => {
      console.log("Session initialized, auth state:",
        sessionService.isAuthenticated() ? "Authenticated" : "Not authenticated");
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Gestionnaire d'erreurs global
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },

    // Initialisation de la sécurité
    {
      provide: APP_INITIALIZER,
      useFactory: initSecurityFeatures,
      deps: [ContentSecurityService],
      multi: true
    },

    // Initialisation de la session
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [SessionService],
      multi: true
    },

    // Configuration du router
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),

    // Configuration HTTP avec les intercepteurs
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        httpErrorInterceptor
      ])
    ),

    // Animations
    provideAnimations(),

    // Redux DevTools (uniquement en développement)
    ...(environment.production
        ? []
        : [
          provideStoreDevtools({
            maxAge: 25,
            logOnly: true,
            autoPause: true,
            trace: false,
            traceLimit: 75,
          })
        ]
    ),
  ]
};
