/**
 * Standard response for account operations.
 * Returned by all account endpoints.
 */
export interface AccountOperationResponse {
  message: string;
  operation: string;
  data?: unknown;
}
