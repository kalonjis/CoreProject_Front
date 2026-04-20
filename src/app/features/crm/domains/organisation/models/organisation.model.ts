import { Tag } from '../../tag/models/tag.model';

/** Lifecycle status of a CRM organisation. */
export enum OrganisationStatus {
  PROSPECT = 'PROSPECT',
  CLIENT   = 'CLIENT'
}

export const ORGANISATION_STATUS_LABELS: Record<OrganisationStatus, string> = {
  [OrganisationStatus.PROSPECT]: 'Prospect',
  [OrganisationStatus.CLIENT]:   'Client'
};

/** Size tier of a CRM organisation. */
export enum OrganisationSize {
  MICRO      = 'MICRO',
  SMALL      = 'SMALL',
  MEDIUM     = 'MEDIUM',
  LARGE      = 'LARGE',
  ENTERPRISE = 'ENTERPRISE'
}

export const ORGANISATION_SIZE_LABELS: Record<OrganisationSize, string> = {
  [OrganisationSize.MICRO]:      'Micro (< 10)',
  [OrganisationSize.SMALL]:      'Petite (10–49)',
  [OrganisationSize.MEDIUM]:     'Moyenne (50–249)',
  [OrganisationSize.LARGE]:      'Grande (250–999)',
  [OrganisationSize.ENTERPRISE]: 'Entreprise (1000+)'
};

// ─── Response models ────────────────────────────────────────────────────────

/** Lightweight organisation representation used in list views and pickers. */
export interface OrganisationSummary {
  publicId:  string;
  name:      string;
  status:    OrganisationStatus;
  industry:  string | null;
  size:      OrganisationSize | null;
  website:   string | null;
  phone:     string | null;
}

/** Full organisation detail payload including tags, address, and audit timestamps. */
export interface OrganisationDetail {
  publicId:         string;
  name:             string;
  status:           OrganisationStatus;
  industry:         string | null;
  size:             OrganisationSize | null;
  website:          string | null;
  phone:            string | null;
  addressPublicId:  string | null;
  notes:            string | null;
  tags:             Tag[];
  createdAt:        string;
  updatedAt:        string;
}

// ─── Request models ─────────────────────────────────────────────────────────

/** Filter criteria for the paginated organisation list endpoint. */
export interface OrganisationFilter {
  keyword?:      string;
  industry?:     string;
  size?:         OrganisationSize;
  status?:       OrganisationStatus;
  countryCode?:  string;
  tagPublicId?:  string;
}

/** Request payload for creating a new organisation. */
export interface CreateOrganisationRequest {
  name:             string;
  website?:         string;
  industry?:        string;
  size?:            OrganisationSize;
  phone?:           string;
  addressPublicId?: string;
  notes?:           string;
}

/** Request payload for partially updating an organisation's profile fields. */
export interface UpdateOrganisationRequest {
  name?:            string;
  website?:         string;
  industry?:        string;
  size?:            OrganisationSize;
  phone?:           string;
  addressPublicId?: string;
  notes?:           string;
}

/** Request payload for merging two organisations (source is archived, target is enriched). */
export interface MergeOrganisationRequest {
  sourcePublicId: string;
  targetPublicId: string;
}

/** Request payload for transitioning an organisation's lifecycle status. */
export interface UpdateOrganisationStatusRequest {
  status: OrganisationStatus;
}
