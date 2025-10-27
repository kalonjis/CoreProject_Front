export interface LoginResponse {
  success: boolean;
  message?: string;
  requires2FA?: boolean;
  available2FAMethods?: string[];
}
