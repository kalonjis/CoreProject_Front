// ─── Enums ──────────────────────────────────────────────────────────────────

export enum SupportTicketStatus {
  OPEN        = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED    = 'RESOLVED',
  CLOSED      = 'CLOSED'
}

// ─── Labels ─────────────────────────────────────────────────────────────────

export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.OPEN]:        'Ouvert',
  [SupportTicketStatus.IN_PROGRESS]: 'En cours',
  [SupportTicketStatus.RESOLVED]:    'Résolu',
  [SupportTicketStatus.CLOSED]:      'Clôturé'
};

/** Transitions autorisées depuis chaque statut */
export const SUPPORT_TICKET_TRANSITIONS: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  [SupportTicketStatus.OPEN]:        [SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.CLOSED],
  [SupportTicketStatus.IN_PROGRESS]: [SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED],
  [SupportTicketStatus.RESOLVED]:    [SupportTicketStatus.CLOSED],
  [SupportTicketStatus.CLOSED]:      []
};

// ─── Response models ─────────────────────────────────────────────────────────

export interface SupportTicketSummary {
  publicId:             string;
  subject:              string;
  status:               SupportTicketStatus;
  contactPublicId:      string;
  contactFullName:      string;
  assignedToPublicId:   string | null;
  assignedToUsername:   string | null;
  createdAt:            string;
}

export interface SupportTicketDetail {
  publicId:             string;
  subject:              string;
  description:          string | null;
  status:               SupportTicketStatus;
  contactPublicId:      string;
  contactFullName:      string;
  assignedToPublicId:   string | null;
  assignedToUsername:   string | null;
  createdAt:            string;
  updatedAt:            string;
}

// ─── Request models ──────────────────────────────────────────────────────────

export interface CreateSupportTicketRequest {
  subject:             string;
  description?:        string;
  submittedByPublicId: string;    // publicId d'un Contact
  assignedToPublicId?: string;    // publicId d'un User
}

export interface UpdateSupportTicketRequest {
  subject?:      string;
  description?:  string;
}

export interface ChangeSupportTicketStatusRequest {
  status: SupportTicketStatus;
}

export interface AssignSupportTicketRequest {
  assignedToPublicId: string | null;
}

export interface SupportTicketFilter {
  keyword?:          string;
  status?:           SupportTicketStatus;
  contactPublicId?:  string;
  assignedToPublicId?: string;
  unassignedOnly?:   boolean;
}
