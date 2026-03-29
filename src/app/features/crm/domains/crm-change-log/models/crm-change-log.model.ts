/**
 * CRM entity types that support field change logging.
 * Matches the backend {@code CrmEntityType} enum.
 */
export type CrmEntityType = 'CONTACT' | 'DEAL' | 'ORGANISATION';

/**
 * A single field change log entry as returned by the API.
 */
export interface CrmChangeLogEntry {
  publicId: string;
  entityType: CrmEntityType;
  entityPublicId: string | null;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string;
}

/**
 * Human-readable labels for tracked field names.
 * Unlisted fields fall back to the raw field name.
 */
export const FIELD_LABELS: Record<string, string> = {
  email:             'Email',
  firstName:         'Prénom',
  lastName:          'Nom',
  phone:             'Téléphone',
  jobTitle:          'Poste',
  notes:             'Notes',
  status:            'Statut',
  title:             'Titre',
  amount:            'Montant',
  currency:          'Devise',
  expectedCloseDate: 'Date de clôture',
  stage:             'Étape',
  lostReason:        'Raison de perte',
  name:              'Nom',
  website:           'Site web',
  industry:          'Secteur',
  size:              'Taille',
};

/**
 * Returns the human-readable label for a field name.
 *
 * @param fieldName raw field name from the API
 * @returns translated label, or the raw field name if not listed
 */
export function fieldLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] ?? fieldName;
}
