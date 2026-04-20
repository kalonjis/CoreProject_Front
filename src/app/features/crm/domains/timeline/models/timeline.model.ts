/**
 * Read model for the CRM unified timeline.
 *
 * A timeline entry is a projection of either an Interaction or a completed CommercialAction,
 * unified into a single {@link TimelineEntryResponse} shape. Entries are never persisted
 * independently — they are computed on the fly by {@code TimelineService} on the backend.
 *
 * The {@link toDisplayType} helper maps any entry to the nearest {@link InteractionType}
 * for badge rendering in {@link InteractionTypeBadgeComponent}.
 */
import {
  CallLogResponse,
  EmailLogResponse,
  InteractionDirection,
  InteractionOutcome,
  InteractionType
} from '../../interaction/models/interaction.model';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum CommercialActionType {
  TASK    = 'TASK',
  CALL    = 'CALL',
  EMAIL   = 'EMAIL',
  MEETING = 'MEETING',
  DEMO    = 'DEMO'
}

export enum CommercialActionPriority {
  LOW    = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH   = 'HIGH'
}

export const COMMERCIAL_ACTION_TYPE_LABELS: Record<CommercialActionType, string> = {
  [CommercialActionType.TASK]:    'Tâche',
  [CommercialActionType.CALL]:    'Appel',
  [CommercialActionType.EMAIL]:   'Email',
  [CommercialActionType.MEETING]: 'Réunion',
  [CommercialActionType.DEMO]:    'Démo'
};

export const COMMERCIAL_ACTION_PRIORITY_LABELS: Record<CommercialActionPriority, string> = {
  [CommercialActionPriority.LOW]:    'Faible',
  [CommercialActionPriority.MEDIUM]: 'Normale',
  [CommercialActionPriority.HIGH]:   'Haute'
};

// ─── Response model ───────────────────────────────────────────────────────────

export interface TimelineEntryResponse {
  sourceType: 'INTERACTION' | 'COMMERCIAL_ACTION';
  publicId:             string;
  subject:              string;
  notes:                string | null;
  occurredAt:           string;
  durationMinutes:      number | null;
  dealPublicId:         string | null;
  contactPublicId:      string | null;
  leadPublicId:         string | null;
  performedByPublicId:  string | null;
  performedByUsername:  string | null;

  // INTERACTION-only
  interactionType:  InteractionType | null;
  direction:        InteractionDirection | null;
  outcome:          InteractionOutcome | null;
  callLog:          CallLogResponse | null;
  emailLog:         EmailLogResponse | null;

  // COMMERCIAL_ACTION-only
  actionType: CommercialActionType | null;
  priority:   CommercialActionPriority | null;
  location:   string | null;

  createdAt: string;
  updatedAt: string;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/**
 * Maps a TimelineEntryResponse to an InteractionType for badge display.
 * COMMERCIAL_ACTION types are mapped to their nearest InteractionType equivalent.
 */
export function toDisplayType(entry: TimelineEntryResponse): InteractionType {
  if (entry.sourceType === 'INTERACTION') {
    return entry.interactionType!;
  }
  switch (entry.actionType) {
    case CommercialActionType.CALL:    return InteractionType.CALL;
    case CommercialActionType.EMAIL:   return InteractionType.EMAIL;
    case CommercialActionType.MEETING: return InteractionType.MEETING;
    case CommercialActionType.DEMO:    return InteractionType.DEMO;
    default:                           return InteractionType.ACTION_DONE; // TASK
  }
}
