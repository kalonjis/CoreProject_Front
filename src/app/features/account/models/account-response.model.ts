/**
 * Standard response for account operations.
 * Returned by all account endpoints.
 */
export interface AccountOperationResponse {
  message: string;
  username?: string;
  operation: string;
  data?: unknown;
}
