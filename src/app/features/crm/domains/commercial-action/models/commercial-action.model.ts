// ─── Enums ──────────────────────────────────────────────────────────────────

export enum CommercialActionStatus {
  PENDING   = 'PENDING',
  DONE      = 'DONE',
  CANCELLED = 'CANCELLED'
}

export enum CommercialActionPriority {
  LOW    = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH   = 'HIGH'
}

// ─── Labels ─────────────────────────────────────────────────────────────────

export const COMMERCIAL_ACTION_STATUS_LABELS: Record<CommercialActionStatus, string> = {
  [CommercialActionStatus.PENDING]:   'En attente',
  [CommercialActionStatus.DONE]:      'Terminée',
  [CommercialActionStatus.CANCELLED]: 'Annulée'
};

export const COMMERCIAL_ACTION_PRIORITY_LABELS: Record<CommercialActionPriority, string> = {
  [CommercialActionPriority.LOW]:    'Faible',
  [CommercialActionPriority.MEDIUM]: 'Normale',
  [CommercialActionPriority.HIGH]:   'Haute'
};

// ─── Response model ──────────────────────────────────────────────────────────

export interface CommercialActionResponse {
  publicId:             string;
  title:                string;
  description:          string | null;
  priority:             CommercialActionPriority;
  status:               CommercialActionStatus;
  dueDate:              string | null;
  completedAt:          string | null;
  isOverdue:            boolean;
  assignedToPublicId:   string;
  assignedToUsername:   string;
  dealPublicId:         string | null;
  contactPublicId:      string | null;
  createdAt:            string;
  updatedAt:            string;
}

// ─── Request models ──────────────────────────────────────────────────────────

export interface CreateCommercialActionRequest {
  title:              string;
  description?:       string;
  priority?:          CommercialActionPriority;
  dueDate?:           string;   // ISO-8601 Instant
  assignedToPublicId: string;
  dealPublicId?:      string;
  contactPublicId?:   string;
}

export interface UpdateCommercialActionRequest {
  title?:             string;
  description?:       string;
  priority?:          CommercialActionPriority;
  dueDate?:           string;
  assignedToPublicId?: string;
}

export interface ReassignCommercialActionRequest {
  assignedToPublicId: string;
}
