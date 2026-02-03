// src/app/features/contact/models/lead.model.ts

/**
 * Lead types matching backend LeadType enum.
 */
export enum LeadType {
  GENERAL = 'GENERAL',
  COMMERCIAL = 'COMMERCIAL',
  PARTNERSHIP = 'PARTNERSHIP',
  PRESS = 'PRESS',
  OTHER = 'OTHER'
}

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  [LeadType.GENERAL]: 'Question générale',
  [LeadType.COMMERCIAL]: 'Commercial / Ventes',
  [LeadType.PARTNERSHIP]: 'Partenariat',
  [LeadType.PRESS]: 'Presse / Média',
  [LeadType.OTHER]: 'Autre'
};

/**
 * Request payload for POST /api/lead
 */
export interface SubmitLeadRequest {
  email: string;
  name?: string;
  subject: string;
  message: string;
  leadType: LeadType;
  website?: string; // Honeypot field
}

/**
 * Response from POST /api/lead
 * Maps to LeadOperationResponse.java
 */
export interface LeadResponse {
  success: boolean;
  message: string;
  referenceId: string | null;
}
