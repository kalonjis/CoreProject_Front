/** Provider used to route the call. */
export type CallProvider = 'TEL_URI' | 'TWILIO' | 'SIP';

/** Lifecycle status of a call session. */
export type CallSessionStatus = 'INITIATED' | 'RINGING' | 'ACTIVE' | 'ENDED' | 'MISSED' | 'FAILED';

/** Terminal statuses accepted by the terminate endpoint. */
export type TerminalCallStatus = 'ENDED' | 'MISSED' | 'FAILED';

/** Server response for a call session (GET + POST + PATCH terminate). */
export interface CallSessionResponse {
  publicId: string;
  provider: CallProvider;
  phoneNumber: string;
  status: CallSessionStatus;
  startedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  contactPublicId: string | null;
  leadPublicId: string | null;
  performedByPublicId: string;
  createdAt: string;
}

/** Request body for POST /api/crm/calls. */
export interface InitiateCallRequest {
  phoneNumber: string;
  contactPublicId?: string;
  leadPublicId?: string;
  direction?: 'INBOUND' | 'OUTBOUND';
}

/** Request body for PATCH /api/crm/calls/:id/terminate. */
export interface TerminateCallRequest {
  status: TerminalCallStatus;
  durationSeconds?: number;
}
