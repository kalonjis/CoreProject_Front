// src/app/features/contact/models/support.model.ts

export interface SubmitPublicSupportRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  description?: string;
  website?: string; // Honeypot
}

export interface PublicSupportResponse {
  reference: string;
  message: string;
}
