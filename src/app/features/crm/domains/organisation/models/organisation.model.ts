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

export interface OrganisationSummary {
  publicId:  string;
  name:      string;
  industry:  string | null;
  size:      OrganisationSize | null;
  website:   string | null;
  phone:     string | null;
}

export interface OrganisationDetail {
  publicId:         string;
  name:             string;
  industry:         string | null;
  size:             OrganisationSize | null;
  website:          string | null;
  phone:            string | null;
  addressPublicId:  string | null;
  notes:            string | null;
  createdAt:        string;
  updatedAt:        string;
}

// ─── Request models ─────────────────────────────────────────────────────────

export interface OrganisationFilter {
  keyword?:     string;
  industry?:    string;
  size?:        OrganisationSize;
  countryCode?: string;
}

export interface CreateOrganisationRequest {
  name:             string;
  website?:         string;
  industry?:        string;
  size?:            OrganisationSize;
  phone?:           string;
  addressPublicId?: string;
  notes?:           string;
}

export interface UpdateOrganisationRequest {
  name?:            string;
  website?:         string;
  industry?:        string;
  size?:            OrganisationSize;
  phone?:           string;
  addressPublicId?: string;
  notes?:           string;
}

export interface MergeOrganisationRequest {
  sourcePublicId: string;
  targetPublicId: string;
}
