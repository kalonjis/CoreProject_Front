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

// ─── Response models ────────────────────────────────────────────────────────

export interface DealSummary {
  publicId:           string;
  title:              string;
  amount:             number | null;
  currency:           string;
  status:             DealStatus;
  stagePublicId:      string;
  stageName:          string;
  contactPublicId:    string;
  contactFullName:    string;
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
  contactPublicId:      string;
  contactFullName:      string;
  organisationPublicId: string | null;
  organisationName:     string | null;
  assignedToPublicId:   string;
  assignedToUsername:   string;
  notes:                string | null;
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
}

export interface ReassignDealRequest {
  assignedToPublicId: string | null;
}
