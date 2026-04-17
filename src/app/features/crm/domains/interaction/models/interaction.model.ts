// ─── Enums ──────────────────────────────────────────────────────────────────

/** Channel or nature of a CRM interaction. */
export enum InteractionType {
  CALL        = 'CALL',
  EMAIL       = 'EMAIL',
  MEETING     = 'MEETING',
  NOTE        = 'NOTE',
  VISIT       = 'VISIT',
  DEMO          = 'DEMO',
  ACTION_DONE   = 'ACTION_DONE',
  CONTACT_FORM  = 'CONTACT_FORM'
}

/** Direction of a CRM interaction relative to the company. */
export enum InteractionDirection {
  OUTBOUND = 'OUTBOUND',
  INBOUND  = 'INBOUND'
}

/** Qualitative outcome of a CRM interaction. */
export enum InteractionOutcome {
  POSITIVE  = 'POSITIVE',
  NEUTRAL   = 'NEUTRAL',
  NEGATIVE  = 'NEGATIVE',
  NO_ANSWER = 'NO_ANSWER'
}

/** Result status of a phone call interaction. */
export enum CallStatus {
  ANSWERED  = 'ANSWERED',
  VOICEMAIL = 'VOICEMAIL',
  NO_ANSWER = 'NO_ANSWER'
}

// ─── Labels ─────────────────────────────────────────────────────────────────

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  [InteractionType.CALL]:        'Appel',
  [InteractionType.EMAIL]:       'Email',
  [InteractionType.MEETING]:     'Réunion',
  [InteractionType.NOTE]:        'Note',
  [InteractionType.VISIT]:       'Visite',
  [InteractionType.DEMO]:        'Démo',
  [InteractionType.ACTION_DONE]:  'Action réalisée',
  [InteractionType.CONTACT_FORM]: 'Formulaire de contact'
};

export const INTERACTION_OUTCOME_LABELS: Record<InteractionOutcome, string> = {
  [InteractionOutcome.POSITIVE]:  'Positif',
  [InteractionOutcome.NEUTRAL]:   'Neutre',
  [InteractionOutcome.NEGATIVE]:  'Négatif',
  [InteractionOutcome.NO_ANSWER]: 'Sans réponse'
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  [CallStatus.ANSWERED]:  'Répondu',
  [CallStatus.VOICEMAIL]: 'Messagerie',
  [CallStatus.NO_ANSWER]: 'Pas de réponse'
};

// ─── Response models ─────────────────────────────────────────────────────────

/** Call-specific metadata attached to a call interaction. */
export interface CallLogResponse {
  phoneNumber:     string | null;
  durationSeconds: number | null;
  status:          CallStatus;
  recordingUrl:    string | null;
}

/** Email-specific metadata attached to an email interaction, including open/click tracking. */
export interface EmailLogResponse {
  emailSubject:      string;
  bodySnippet:       string | null;
  externalMessageId: string | null;
  openedAt:          string | null;
  clickedAt:         string | null;
  wasOpened:         boolean;
  wasClicked:        boolean;
}

/** Full interaction payload returned by the API, including optional call and email sub-logs. */
export interface InteractionResponse {
  publicId:             string;
  type:                 InteractionType;
  direction:            InteractionDirection | null;
  subject:              string;
  notes:                string | null;
  outcome:              InteractionOutcome | null;
  durationMinutes:      number | null;
  occurredAt:           string;
  dealPublicId:         string | null;
  contactPublicId:      string | null;
  performedByPublicId:  string | null;
  performedByUsername:  string | null;
  callLog:              CallLogResponse | null;
  emailLog:             EmailLogResponse | null;
  createdAt:            string;
  updatedAt:            string;
}

// ─── Request models ──────────────────────────────────────────────────────────

/** Request payload carrying call-specific details when logging a call interaction. */
export interface CallLogRequest {
  phoneNumber?:    string;
  durationSeconds?: number;
  status:          CallStatus;
  recordingUrl?:   string;
}

/** Request payload carrying email-specific details when logging an email interaction. */
export interface EmailLogRequest {
  emailSubject:      string;
  bodySnippet?:      string;
  externalMessageId?: string;
}

/** Request payload for logging a new CRM interaction, with optional call or email sub-log. */
export interface LogInteractionRequest {
  type:              InteractionType;
  direction?:        InteractionDirection;
  subject:           string;
  notes?:            string;
  outcome?:          InteractionOutcome;
  durationMinutes?:  number;
  occurredAt:        string;    // ISO-8601 Instant
  dealPublicId?:     string;
  contactPublicId?:  string;
  leadPublicId?:     string;
  callLog?:          CallLogRequest;
  emailLog?:         EmailLogRequest;
}

/** Request payload for partially updating a logged interaction's metadata. */
export interface UpdateInteractionRequest {
  subject?:         string;
  notes?:           string;
  outcome?:         InteractionOutcome;
  durationMinutes?: number;
  occurredAt?:      string;
}
