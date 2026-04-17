import { InteractionOutcome } from '../../interaction/models/interaction.model';

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Types of commercial actions that can be scheduled for a CRM entity. */
export enum CommercialActionType {
  TASK    = 'TASK',
  CALL    = 'CALL',
  EMAIL   = 'EMAIL',
  MEETING = 'MEETING',
  DEMO    = 'DEMO'
}

export const COMMERCIAL_ACTION_TYPE_LABELS: Record<CommercialActionType, string> = {
  [CommercialActionType.TASK]:    'Tâche',
  [CommercialActionType.CALL]:    'Appel téléphonique',
  [CommercialActionType.EMAIL]:   'Email',
  [CommercialActionType.MEETING]: 'Réunion / RDV',
  [CommercialActionType.DEMO]:    'Démonstration'
};

/** Types that require a calendar slot (MEETING, DEMO) */
export function requiresCalendarSlot(type: CommercialActionType): boolean {
  return type === CommercialActionType.MEETING || type === CommercialActionType.DEMO;
}

/** Lifecycle status of a commercial action. */
export enum CommercialActionStatus {
  PENDING   = 'PENDING',
  DONE      = 'DONE',
  CANCELLED = 'CANCELLED'
}

/** Priority level of a commercial action. */
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

/** API response payload representing a persisted commercial action. */
export interface CommercialActionResponse {
  publicId:           string;
  title:              string;
  description:        string | null;
  type:               CommercialActionType;
  priority:           CommercialActionPriority;
  status:             CommercialActionStatus;
  dueDate:            string | null;
  completedAt:        string | null;
  isOverdue:          boolean;
  assignedToPublicId: string;
  assignedToUsername: string;
  dealPublicId:       string | null;
  contactPublicId:    string | null;
  leadPublicId:       string | null;
  reminderAt:         string | null;
  reminderSentAt:     string | null;
  location:           string | null;
  durationMinutes:    number | null;
  createdAt:          string;
  updatedAt:          string;
}

// ─── Request models ──────────────────────────────────────────────────────────

/** Request payload for creating a new commercial action. */
export interface CreateCommercialActionRequest {
  title:              string;
  description?:       string;
  type?:              CommercialActionType;
  priority?:          CommercialActionPriority;
  dueDate?:           string;   // ISO-8601 Instant
  assignedToPublicId: string;
  dealPublicId?:      string;
  contactPublicId?:   string;
  leadPublicId?:      string;
  reminderAt?:        string;   // ISO-8601 Instant
  location?:          string;
  addressPublicId?:   string;
  durationMinutes?:   number;
}

/** Request payload for partially updating an existing commercial action. */
export interface UpdateCommercialActionRequest {
  title?:             string;
  description?:       string;
  type?:              CommercialActionType;
  priority?:          CommercialActionPriority;
  dueDate?:           string;
  assignedToPublicId?: string;
  reminderAt?:        string;   // ISO-8601 Instant
  location?:          string;
  addressPublicId?:   string;
  durationMinutes?:   number;
}

/** Request payload for reassigning a commercial action to another user. */
export interface ReassignCommercialActionRequest {
  assignedToPublicId: string;
}

/** Outcome status of a completed phone call action. */
export enum CallStatus {
  ANSWERED  = 'ANSWERED',
  VOICEMAIL = 'VOICEMAIL',
  NO_ANSWER = 'NO_ANSWER'
}

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  [CallStatus.ANSWERED]:  'Répondu',
  [CallStatus.VOICEMAIL]: 'Messagerie vocale',
  [CallStatus.NO_ANSWER]: 'Pas de réponse'
};

/** Completion details for a CALL-type commercial action. */
export interface CompleteCallDetails {
  status:           CallStatus;
  durationSeconds?: number;
  phoneNumber?:     string;
}

/** Completion details for an EMAIL-type commercial action. */
export interface CompleteEmailDetails {
  emailSubject:       string;
  bodySnippet?:       string;
  externalMessageId?: string;
}

/** Completion details for a MEETING or DEMO-type commercial action. */
export interface CompleteMeetingDetails {
  outcome?: InteractionOutcome;
  notes?:   string;
}

/** Request payload for marking a commercial action as completed, with optional type-specific details. */
export interface CompleteCommercialActionRequest {
  callLogDetails?:    CompleteCallDetails;
  emailLogDetails?:   CompleteEmailDetails;
  meetingLogDetails?: CompleteMeetingDetails;
}
