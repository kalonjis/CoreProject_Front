/** Response from GET /api/crm/telephony/sip/connection */
export interface SipConnectionDetails {
  wsUrl: string;
  sipDomain: string;
  sipUsername: string;
  sipPassword: string;
  displayName: string | null;
}
