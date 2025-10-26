export interface WebAuthnSetupResponse {
  success: boolean;
  message: string;
  type: string;
  challenge: string;
  credentialCreationOptions: WebAuthnCredentialCreationOptions;
  instructions: string;
}

export interface WebAuthnCredentialCreationOptions {
  challenge: string;
  rp: RelyingParty;
  user: UserInfo;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  authenticatorSelection: AuthenticatorSelection;
  timeout: number;
  attestation: AttestationConveyancePreference; // ← Type strict au lieu de string
}

export interface RelyingParty {
  name: string;
  id: string;
}

export interface UserInfo {
  id: string;
  name: string;
  displayName: string;
}

export interface PublicKeyCredentialParameters {
  type: "public-key"; // ← Type strict au lieu de string
  alg: number;
}

export interface AuthenticatorSelection {
  authenticatorAttachment?: "platform" | "cross-platform"; // ← Types stricts + optionnel
  userVerification?: "required" | "preferred" | "discouraged"; // ← Types stricts + optionnel
  requireResidentKey?: boolean; // ← Optionnel
}

// Type pour les valeurs d'attestation
export type AttestationConveyancePreference = "none" | "indirect" | "direct";
