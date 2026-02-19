// src/app/features/account/models/reactivation-request.model.ts

/**
 * Request payload for account reactivation.
 * POST /api/account/request-reactivation
 */
export interface ReactivateAccountRequest {
  identifier: string;
}
