// src/app/features/account/models/deactivation-request.model.ts

import { DeactivationReason } from './deactivation-reason.enum';

/**
 * Request payload for account deactivation.
 * POST /api/account/request-deactivation
 *
 * Aligned with backend: DeactivateAccountRequest record
 * - reason: DeactivationReason enum (not a plain string)
 * - reasonDetails: required, 10–500 chars
 */
export interface DeactivateAccountRequest {
  reason: DeactivationReason;
  reasonDetails: string;
}
