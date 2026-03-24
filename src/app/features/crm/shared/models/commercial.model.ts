export interface CommercialSummary {
  publicId: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
}

export function commercialDisplayName(c: CommercialSummary): string {
  if (c.firstName || c.lastName) {
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
  }
  return c.username;
}
