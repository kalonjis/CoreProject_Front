import { Tag } from '../../tag/models/tag.model';

export enum ContactStatus {
  NEW      = 'NEW',
  ENGAGED  = 'ENGAGED',
  QUALIFIED = 'QUALIFIED',
  CLIENT   = 'CLIENT',
  LOST     = 'LOST',
  INACTIVE = 'INACTIVE'
}

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  [ContactStatus.NEW]:       'Nouveau',
  [ContactStatus.ENGAGED]:   'Engagé',
  [ContactStatus.QUALIFIED]: 'Qualifié',
  [ContactStatus.CLIENT]:    'Client',
  [ContactStatus.LOST]:      'Perdu',
  [ContactStatus.INACTIVE]:  'Inactif'
};

export const CONTACT_STATUS_TRANSITIONS: Record<ContactStatus, ContactStatus[]> = {
  [ContactStatus.NEW]:       [ContactStatus.ENGAGED, ContactStatus.INACTIVE, ContactStatus.LOST],
  [ContactStatus.ENGAGED]:   [ContactStatus.QUALIFIED, ContactStatus.INACTIVE, ContactStatus.LOST],
  [ContactStatus.QUALIFIED]: [ContactStatus.CLIENT, ContactStatus.LOST, ContactStatus.INACTIVE],
  [ContactStatus.CLIENT]:    [ContactStatus.LOST, ContactStatus.INACTIVE],
  [ContactStatus.LOST]:      [ContactStatus.ENGAGED],
  [ContactStatus.INACTIVE]:  [ContactStatus.ENGAGED]
};

// ─── Response models ───────────────────────────────────────────────────────────

export interface ContactSummary {
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  status: ContactStatus;
  organisationPublicId: string | null;
  organisationName: string | null;
  assignedTo: string | null;
  hasLinkedUser: boolean;
}

export interface ContactDetail {
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  status: ContactStatus;
  assignedToPublicId: string | null;
  assignedToUsername: string | null;
  organisationPublicId: string | null;
  originLeadPublicId: string | null;
  hasLinkedUser: boolean;
  linkedUserPublicId: string | null;
  notes: string | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

// ─── Request models ────────────────────────────────────────────────────────────

export interface ContactFilter {
  keyword?: string;
  status?: ContactStatus;
  organisationPublicId?: string;
  withoutOrganisation?: boolean;
  assignedToPublicId?: string;
  hasLinkedUser?: boolean;
  convertedFromLead?: boolean;
  tagPublicId?: string;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  organisationPublicId?: string;
  notes?: string;
}

export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  notes?: string;
}

export interface UpdateContactStatusRequest {
  status: ContactStatus;
}

export interface AssignContactRequest {
  commercialPublicId: string | null;
}

export interface LinkContactOrganisationRequest {
  organisationPublicId: string | null;
}

export interface MergeContactRequest {
  sourcePublicId: string;
  targetPublicId: string;
}
