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
  [LeadType.GENERAL]:     "J'ai une question",
  [LeadType.COMMERCIAL]:  'Je souhaite un devis / une offre',
  [LeadType.PARTNERSHIP]: 'Je propose un partenariat',
  [LeadType.PRESS]:       'Je suis journaliste / média',
  [LeadType.OTHER]:       'Autre demande'
};

export enum Civility {
  MR  = 'MR',
  MRS = 'MRS'
}

export const CIVILITY_LABELS: Record<Civility, string> = {
  [Civility.MR]:  'M.',
  [Civility.MRS]: 'Mme'
};

export enum LeadSource {
  CONTACT_FORM   = 'CONTACT_FORM',
  PHONE          = 'PHONE',
  EMAIL          = 'EMAIL',
  REFERRAL       = 'REFERRAL',
  SOCIAL_MEDIA   = 'SOCIAL_MEDIA',
  PAID_CAMPAIGN  = 'PAID_CAMPAIGN',
  ORGANIC_SEARCH = 'ORGANIC_SEARCH',
  EVENT          = 'EVENT',
  MANUAL         = 'MANUAL',
  OTHER          = 'OTHER'
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  [LeadSource.CONTACT_FORM]:   'Formulaire web',
  [LeadSource.PHONE]:          'Appel téléphonique',
  [LeadSource.EMAIL]:          'Email entrant',
  [LeadSource.REFERRAL]:       'Recommandation',
  [LeadSource.SOCIAL_MEDIA]:   'Réseaux sociaux',
  [LeadSource.PAID_CAMPAIGN]:  'Campagne payante',
  [LeadSource.ORGANIC_SEARCH]: 'Recherche organique',
  [LeadSource.EVENT]:          'Événement',
  [LeadSource.MANUAL]:         'Saisie manuelle',
  [LeadSource.OTHER]:          'Autre'
};

/**
 * Request payload for POST /api/lead
 */
export interface SubmitLeadRequest {
  email: string;
  civility?: Civility;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organisationName?: string;
  message: string;
  leadType: LeadType;
  leadSource?: LeadSource;
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
