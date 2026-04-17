/**
 * Shared models for CRM commercial (sales rep) references.
 *
 * Used across multiple domains (lead, deal, commercial-action, support-ticket)
 * whenever a user needs to be displayed or selected as an assignee.
 */

/**
 * Lightweight projection of a CRM user who holds the COMMERCIAL role.
 * Returned by {@code GET /api/crm/users/commercials}.
 */
export interface CommercialSummary {
  publicId: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
}

/**
 * Returns the best available display name for a commercial.
 * Prefers "firstName lastName"; falls back to username when names are absent.
 *
 * @param c the commercial summary to format
 */
export function commercialDisplayName(c: CommercialSummary): string {
  if (c.firstName || c.lastName) {
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
  }
  return c.username;
}
