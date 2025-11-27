// app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthFacade } from '../core/auth'
import {authInterceptor} from '../core/http';

/**
 * Initialize authentication state on app bootstrap.
 * Uses AuthFacade which populates AuthStore and DeviceStore.
 */
function initializeAuth(authFacade: AuthFacade) {
  return () => authFacade.initialize();
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
      deps: [AuthFacade],
      multi: true
    }
  ]
};
