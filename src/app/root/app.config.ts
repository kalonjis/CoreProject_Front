// app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import {OldAuthService} from '../core/auth/services/old.auth.service';
import {authInterceptor} from '../core/http/auth-interceptor';

// Initialisation de l'authentification
function initializeAuth(authService: OldAuthService) {
  return () => authService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [OldAuthService],
      multi: true
    }
  ]
};
