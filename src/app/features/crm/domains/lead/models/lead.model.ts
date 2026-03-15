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

// ─── Response models ───────────────────────────────────────────────────────────

export interface LeadSummary {
  publicId: string;
  email: string;
  name: string | null;
  subject: string;
  leadType: LeadType;
  status: LeadStatus;
  assignedTo: string | null;
  submittedAt: string;
  convertedAt: string | null;
}

export interface LeadDetail {
  publicId: string;
  email: string;
  name: string | null;
  subject: string;
  leadType: LeadType;
  status: LeadStatus;
  assignedToPublicId: string | null;
  assignedToUsername: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Request models ────────────────────────────────────────────────────────────

export interface LeadFilter {
  status?: LeadStatus;
  leadType?: LeadType;
  assignedToPublicId?: string;
  unassignedOnly?: boolean;
  keyword?: string;
  submittedFrom?: string;
  submittedTo?: string;
}

export interface AssignLeadRequest {
  commercialPublicId: string;
}

export interface ConvertLeadRequest {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  phone?: string;
  organisationPublicId?: string;
}

export interface RejectLeadRequest {
  rejectionReason: string;
}
