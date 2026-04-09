export enum LeadStatus {
  NEW        = 'NEW',
  IN_REVIEW  = 'IN_REVIEW',
  CONVERTED  = 'CONVERTED',
  REJECTED   = 'REJECTED'
}

export enum LeadType {
  GENERAL     = 'GENERAL',
  COMMERCIAL  = 'COMMERCIAL',
  PARTNERSHIP = 'PARTNERSHIP',
  PRESS       = 'PRESS',
  OTHER       = 'OTHER'
}

export enum Civility {
  MR  = 'MR',
  MRS = 'MRS'
}

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

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]:       'Nouveau',
  [LeadStatus.IN_REVIEW]: 'En revue',
  [LeadStatus.CONVERTED]: 'Converti',
  [LeadStatus.REJECTED]:  'Rejeté'
};

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  [LeadType.GENERAL]:     'Général',
  [LeadType.COMMERCIAL]:  'Commercial',
  [LeadType.PARTNERSHIP]: 'Partenariat',
  [LeadType.PRESS]:       'Presse',
  [LeadType.OTHER]:       'Autre'
};

export const CIVILITY_LABELS: Record<Civility, string> = {
  [Civility.MR]:  'M.',
  [Civility.MRS]: 'Mme'
};

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

// ─── Response models ───────────────────────────────────────────────────────────

export interface LeadSummary {
  publicId: string;
  email: string;
  name: string | null;
  organisationName: string | null;
  subject: string;
  leadType: LeadType;
  leadSource: LeadSource | null;
  status: LeadStatus;
  assignedTo: string | null;
  submittedAt: string;
  convertedAt: string | null;
}

export interface LeadDetail {
  publicId: string;
  email: string;
  civility: Civility | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  organisationName: string | null;
  subject: string;
  message: string | null;
  leadType: LeadType;
  leadSource: LeadSource | null;
  status: LeadStatus;
  assignedToPublicId: string | null;
  assignedToUsername: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  existingContactPublicId: string | null;
}

// ─── Request models ────────────────────────────────────────────────────────────

export interface LeadFilter {
  status?: LeadStatus;
  leadType?: LeadType;
  leadSource?: LeadSource;
  assignedToPublicId?: string;
  unassignedOnly?: boolean;
  activeOnly?: boolean;
  keyword?: string;
  submittedFrom?: string;
  submittedTo?: string;
}

export interface EnrichLeadRequest {
  civility?: Civility | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  organisationName?: string | null;
  leadType?: LeadType | null;
  leadSource?: LeadSource | null;
}

export interface AssignLeadRequest {
  commercialPublicId: string;
}

export interface ConvertLeadRequest {
  firstName: string;
  lastName: string;
  email?: string;
  jobTitle?: string;
  phone?: string;
  organisationName?: string;
}

export interface RejectLeadRequest {
  rejectionReason: string;
}

export interface CreateLeadRequest {
  email: string;
  civility?: Civility;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organisationName?: string;
  subject: string;
  message?: string;
  leadType: LeadType;
}
