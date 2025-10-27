export interface TwoFARequest {
  code: string;
  method: string;
  rememberDevice?: boolean;
}
