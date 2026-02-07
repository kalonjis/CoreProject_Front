import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Calendar-specific error codes from the backend.
 */
export enum CalendarErrorCode {
  EVENT_NOT_FOUND = 'CALENDAR_EVENT_NOT_FOUND',
  OWNERSHIP_VIOLATION = 'OWNERSHIP_VIOLATION',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  EVENT_CANCELLED = 'EVENT_ALREADY_CANCELLED',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * Structured error response from the calendar API.
 */
export interface CalendarApiError {
  code: CalendarErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Custom error class for calendar-specific errors.
 *
 * @description
 * Wraps HTTP errors with calendar-specific context for better
 * error handling in components.
 *
 * @example
 * ```typescript
 * api.getEvent(id).pipe(
 *   catchError(error => {
 *     if (error instanceof CalendarError) {
 *       if (error.code === CalendarErrorCode.EVENT_NOT_FOUND) {
 *         // Handle not found
 *       }
 *     }
 *   })
 * );
 * ```
 */
export class CalendarError extends Error {
  constructor(
    public readonly code: CalendarErrorCode | string,
    public readonly originalMessage: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(originalMessage);
    this.name = 'CalendarError';
  }

  /**
   * Checks if this is a not found error.
   */
  isNotFound(): boolean {
    return this.status === 404 || this.code === CalendarErrorCode.EVENT_NOT_FOUND;
  }

  /**
   * Checks if this is an authorization error.
   */
  isUnauthorized(): boolean {
    return this.status === 403 || this.code === CalendarErrorCode.OWNERSHIP_VIOLATION;
  }

  /**
   * Checks if this is a validation error.
   */
  isValidation(): boolean {
    return this.status === 400 || this.code === CalendarErrorCode.VALIDATION_ERROR;
  }
}

/**
 * Error messages in French for user display.
 */
const ERROR_MESSAGES: Record<string, string> = {
  [CalendarErrorCode.EVENT_NOT_FOUND]: 'Événement introuvable',
  [CalendarErrorCode.OWNERSHIP_VIOLATION]: 'Vous n\'avez pas accès à cet événement',
  [CalendarErrorCode.INVALID_DATE_RANGE]: 'La plage de dates est invalide',
  [CalendarErrorCode.EVENT_CANCELLED]: 'Cet événement est déjà annulé',
  [CalendarErrorCode.VALIDATION_ERROR]: 'Les données fournies sont invalides',
  'default': 'Une erreur est survenue'
};

/**
 * Gets a user-friendly error message.
 *
 * @param error - The calendar error
 * @returns Localized error message
 */
export function getErrorMessage(error: CalendarError): string {
  return ERROR_MESSAGES[error.code] || ERROR_MESSAGES['default'];
}

/**
 * HTTP interceptor for calendar API error handling.
 *
 * @description
 * Intercepts HTTP errors from calendar API endpoints and:
 * - Transforms them into CalendarError instances
 * - Logs errors for debugging
 * - Optionally redirects on specific errors
 *
 * Only processes requests to `/api/calendar/*` endpoints.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([calendarErrorInterceptor])
 *     )
 *   ]
 * };
 * ```
 */
export const calendarErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Only process calendar API requests
  if (!req.url.includes('/api/calendar')) {
    return next(req);
  }

  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Parse the error response
      const calendarError = parseError(error);

      // Log for debugging
      console.error('[CalendarAPI Error]', {
        url: req.url,
        method: req.method,
        status: error.status,
        code: calendarError.code,
        message: calendarError.originalMessage
      });

      // Handle specific errors
      switch (error.status) {
        case 401:
          // Unauthorized - could redirect to login
          // router.navigate(['/auth/login']);
          break;

        case 403:
          // Forbidden - could redirect to calendar home
          // router.navigate(['/calendar']);
          break;

        case 404:
          // Not found - component should handle this
          break;

        case 500:
          // Server error - could show global error notification
          break;
      }

      // Re-throw as CalendarError for component handling
      return throwError(() => calendarError);
    })
  );
};

/**
 * Parses an HTTP error response into a CalendarError.
 */
function parseError(response: HttpErrorResponse): CalendarError {
  // Try to extract structured error from response body
  const body = response.error;

  if (body && typeof body === 'object') {
    // Check for standard error structure
    if (body.code || body.message) {
      return new CalendarError(
        body.code || 'UNKNOWN_ERROR',
        body.message || response.message,
        response.status,
        body.details
      );
    }

    // Check for validation errors
    if (body.errors && Array.isArray(body.errors)) {
      return new CalendarError(
        CalendarErrorCode.VALIDATION_ERROR,
        body.errors.map((e: { message?: string }) => e.message).join(', '),
        response.status,
        { errors: body.errors }
      );
    }
  }

  // Fallback to HTTP status-based error
  return new CalendarError(
    mapStatusToCode(response.status),
    response.message || 'An error occurred',
    response.status
  );
}

/**
 * Maps HTTP status codes to error codes.
 */
function mapStatusToCode(status: number): string {
  switch (status) {
    case 400:
      return CalendarErrorCode.VALIDATION_ERROR;
    case 403:
      return CalendarErrorCode.OWNERSHIP_VIOLATION;
    case 404:
      return CalendarErrorCode.EVENT_NOT_FOUND;
    default:
      return 'UNKNOWN_ERROR';
  }
}

/**
 * Factory to create a custom calendar error interceptor.
 *
 * @param options - Interceptor configuration
 * @returns Configured HttpInterceptorFn
 *
 * @example
 * ```typescript
 * const customInterceptor = createCalendarErrorInterceptor({
 *   onError: (error) => {
 *     const toast = inject(ToastService);
 *     toast.error(getErrorMessage(error));
 *   },
 *   redirectOn404: '/calendar',
 *   redirectOn403: '/calendar'
 * });
 * ```
 */
export function createCalendarErrorInterceptor(options: {
  onError?: (error: CalendarError) => void;
  redirectOn404?: string;
  redirectOn403?: string;
  redirectOn401?: string;
}): HttpInterceptorFn {
  return (req, next) => {
    if (!req.url.includes('/api/calendar')) {
      return next(req);
    }

    const router = inject(Router);

    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const calendarError = parseError(error);

        // Custom error callback
        options.onError?.(calendarError);

        // Redirects
        if (error.status === 404 && options.redirectOn404) {
          router.navigate([options.redirectOn404]);
        } else if (error.status === 403 && options.redirectOn403) {
          router.navigate([options.redirectOn403]);
        } else if (error.status === 401 && options.redirectOn401) {
          router.navigate([options.redirectOn401]);
        }

        return throwError(() => calendarError);
      })
    );
  };
}
