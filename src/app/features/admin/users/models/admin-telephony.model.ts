export interface AdminUserTelephonyStatus {
  effectiveProvider: 'SIP' | 'TWILIO' | 'NONE';
  globalProvider: 'SIP' | 'TWILIO' | 'TEL_URI';
  sipConfig: AdminSipConfigSummary | null;
  twilioIdentity: string | null;
}

export interface AdminSipConfigSummary {
  publicId: string;
  sipUsername: string;
  displayName: string | null;
  updatedAt: string;
}

export interface AdminSaveSipConfigRequest {
  sipUsername: string;
  sipPassword: string;
  displayName?: string | null;
}
