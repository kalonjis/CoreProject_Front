import {HttpErrorSubType, HttpErrorType} from '../types/http-error-type';

export interface HttpErrorContext {
  // Identification de l'erreur
  type: HttpErrorType;
  subType?: HttpErrorSubType;
  statusCode: number;

  // Action à entreprendre
  action: 'redirect' | 'modal' | 'inline' | 'banner' | 'feedback' | 'page' | 'retry';

  // Destination et message
  destination?: string;
  message?: string;
  title?: string;

  // Propriétés de comportement
  canRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  showDetails?: boolean;

  // Feedback spécifique
  feedbackType?: 'error' | 'warning' | 'info' | 'success';
  feedbackDuration?: number;

  // Actions personnalisées
  customActions?: HttpErrorAction[];

  // Métadonnées
  timestamp?: Date;
  url?: string;
  userAgent?: string;
  userId?: string;
}

export interface HttpErrorAction {
  label: string;
  action: () => void | Promise<void>;
  style: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  icon?: string;
}

export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number; // Pour exponential backoff
  onRetry?: (attempt: number) => void;
}
