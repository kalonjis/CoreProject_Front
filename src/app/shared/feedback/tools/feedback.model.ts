// src/app/shared/feedback/models/feedback.model.ts
export type FeedbackType = 'success' | 'error' | 'info' | 'warning';

export interface FeedbackOptions {
  message: string;
  type: FeedbackType;
  buttonText?: string;
  timeout?: number | null;
}
