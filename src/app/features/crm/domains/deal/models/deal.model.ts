import { Tag } from '../../tag/models/tag.model';

export enum DealStatus {
  OPEN = 'OPEN',
  WON  = 'WON',
  LOST = 'LOST'
}

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  [DealStatus.OPEN]: 'En cours',
  [DealStatus.WON]:  'Gagné',
  [DealStatus.LOST]: 'Perdu'
};

export enum ContactRole {
  DECISION_MAKER = 'DECISION_MAKER',
  INFLUENCER     = 'INFLUENCER',
  SIGNER         = 'SIGNER',
  TECHNICAL      = 'TECHNICAL',
  USER           = 'USER',
  OTHER          = 'OTHER'
}

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  [ContactRole.DECISION_MAKER]: 'Décisionnaire',
  [ContactRole.INFLUENCER]:     'Influenceur',
  [ContactRole.SIGNER]:         'Signataire',
  [ContactRole.TECHNICAL]:      'Technique',
  [ContactRole.USER]:           'Utilisateur',
  [ContactRole.OTHER]:          'Autre'
};

// ─── Response models ────────────────────────────────────────────────────────

export interface DealContactRoleResponse {
  contactPublicId:  string;
  contactFullName:  string;
  contactEmail:     string | null;
  role:             ContactRole;
  primary:          boolean;
}

export interface DealSummary {
  publicId:           string;
  title:              string;
  amount:             number | null;
  currency:           string;
  status:             DealStatus;
  stagePublicId:      string;
  stageName:          string;
  contactPublicId:    string | null;
  contactFullName:    string | null;
  assignedToPublicId: string;
  assignedToUsername: string;
  isOverdue:          boolean;
  expectedCloseDate:  string | null;
}

export interface DealDetail {
  publicId:             string;
  title:                string;
  amount:               number | null;
  currency:             string;
  status:               DealStatus;
  expectedCloseDate:    string | null;
  closedAt:             string | null;
  pipelinePublicId:     string;
  pipelineName:         string;
  stagePublicId:        string;
  stageName:            string;
  isOverdue:            boolean;
  contactPublicId:      string | null;
  contactFullName:      string | null;
  contacts:             DealContactRoleResponse[];
  organisationPublicId: string | null;
  organisationName:     string | null;
  assignedToPublicId:   string;
  assignedToUsername:   string;
  notes:                string | null;
  lostReason:           string | null;
  tags:                 Tag[];
  createdAt:            string;
  updatedAt:            string;
}

// ─── Request models ─────────────────────────────────────────────────────────

export interface DealFilter {
  keyword?:             string;
  status?:              DealStatus;
  pipelinePublicId?:    string;
  stagePublicId?:       string;
  assignedToPublicId?:  string;
  contactPublicId?:     string;
  organisationPublicId?:string;
  overdueOnly?:         boolean;
  amountMin?:           number;
  amountMax?:           number;
  expectedCloseFrom?:   string;
  expectedCloseTo?:     string;
  tagPublicId?:         string;
}

export interface CreateDealRequest {
  title:                string;
  amount?:              number;
  currency?:            string;
  pipelinePublicId:     string;
  stagePublicId:        string;
  contactPublicId:      string;
  organisationPublicId?:string;
  assignedToPublicId:   string;
  expectedCloseDate?:   string;
  notes?:               string;
}

export interface UpdateDealRequest {
  title?:             string;
  amount?:            number;
  currency?:          string;
  expectedCloseDate?: string;
  notes?:             string;
}

export interface MoveDealStageRequest {
  stagePublicId: string;
  lostReason?:   string;
}

export interface ReassignDealRequest {
  assignedToPublicId: string | null;
}

export interface AddDealContactRoleRequest {
  contactPublicId: string;
  role?:           ContactRole;
}

export interface UpdateDealContactRoleRequest {
  role: ContactRole;
}
