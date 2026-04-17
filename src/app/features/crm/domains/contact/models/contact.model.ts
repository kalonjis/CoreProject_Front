import { Tag } from '../../tag/models/tag.model';

/** Lifecycle status of a CRM contact. */
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

/** Lightweight contact representation used in list views and pickers. */
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

/** Full contact detail payload including tags, linked user, and audit timestamps. */
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

/** Filter criteria for the paginated contact list endpoint. */
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

/** Request payload for creating a new contact. */
export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  organisationPublicId?: string;
  notes?: string;
}

/** Request payload for partially updating a contact's profile fields. */
export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  notes?: string;
}

/** Request payload for transitioning a contact's lifecycle status. */
export interface UpdateContactStatusRequest {
  status: ContactStatus;
}

/** Request payload for assigning or unassigning a contact to a commercial. */
export interface AssignContactRequest {
  commercialPublicId: string | null;
}

/** Request payload for linking or unlinking a contact to an organisation. */
export interface LinkContactOrganisationRequest {
  organisationPublicId: string | null;
}

/** Request payload for merging two contacts (source is archived, target is enriched). */
export interface MergeContactRequest {
  sourcePublicId: string;
  targetPublicId: string;
}
