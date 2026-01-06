// src/app/shared/address/models/address-config.model.ts

import { AddressType, AddressContext } from './address-type.enum';

/**
 * Configuration pour le composant AddressList.
 */
export interface AddressListConfig {
  // Contexte d'utilisation
  context: AddressContext;

  // Mode d'affichage
  displayMode: 'cards' | 'table' | 'compact';

  // Colonnes/infos à afficher
  showType: boolean;
  showLabel: boolean;
  showEligibilityFlags: boolean;
  showValidityPeriod: boolean;
  showVerifiedBadge: boolean;
  showCoordinates: boolean;

  // Actions disponibles
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSetDefault: boolean;
  canSetPrimary: boolean;
  canChangeType: boolean;

  // Filtres
  showFilters: boolean;
  showSearch: boolean;
  defaultActiveOnly: boolean;

  // Pagination
  paginated: boolean;
  pageSize: number;

  // Empty state
  emptyStateMessage: string;
  emptyStateIcon: string;
}

/**
 * Configuration pour le composant AddressForm.
 */
export interface AddressFormConfig {
  // Contexte d'utilisation
  context: AddressContext;

  // Types autorisés dans le select
  allowedTypes: AddressType[];

  // Champs à afficher
  showComplement: boolean;
  showStateProvince: boolean;
  showLabel: boolean;
  showNotes: boolean;
  showEligibilityFlags: boolean;
  showDefaultCheckbox: boolean;
  showPrimaryCheckbox: boolean;

  // Champs requis (en plus des obligatoires de base)
  requireStateProvince: boolean;

  // Valeurs par défaut
  defaultCountryCode: string;
  defaultType: AddressType;

  // Validation
  enableAutocomplete: boolean;  // Pour intégration future Google Places
}

/**
 * Configuration pour le composant AddressCard.
 */
export interface AddressCardConfig {
  // Affichage
  showFullAddress: boolean;
  showType: boolean;
  showBadges: boolean;
  showActions: boolean;

  // Actions
  actions: AddressCardAction[];

  // Style
  compact: boolean;
  clickable: boolean;
}

/**
 * Actions possibles sur une carte d'adresse.
 */
export type AddressCardAction =
  | 'edit'
  | 'delete'
  | 'setDefault'
  | 'setPrimary'
  | 'changeType'
  | 'view';

/**
 * Événement émis lors d'une action sur une adresse.
 */
export interface AddressActionEvent {
  action: AddressCardAction;
  publicId: string;
  data?: unknown;  // Données additionnelles selon l'action
}

// =============================================================================
// CONFIGURATIONS PAR DÉFAUT
// =============================================================================

/**
 * Config liste par défaut pour le contexte USER (profile).
 */
export const DEFAULT_USER_LIST_CONFIG: AddressListConfig = {
  context: 'user',
  displayMode: 'cards',
  showType: true,
  showLabel: true,
  showEligibilityFlags: true,
  showValidityPeriod: false,
  showVerifiedBadge: false,
  showCoordinates: false,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canSetDefault: true,
  canSetPrimary: true,
  canChangeType: true,
  showFilters: true,
  showSearch: false,
  defaultActiveOnly: true,
  paginated: false,
  pageSize: 20,
  emptyStateMessage: 'Aucune adresse enregistrée',
  emptyStateIcon: 'map-pin-off'
};

/**
 * Config liste par défaut pour le contexte ADMIN.
 */
export const DEFAULT_ADMIN_LIST_CONFIG: AddressListConfig = {
  context: 'admin',
  displayMode: 'table',
  showType: true,
  showLabel: true,
  showEligibilityFlags: true,
  showValidityPeriod: true,
  showVerifiedBadge: true,
  showCoordinates: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canSetDefault: true,
  canSetPrimary: true,
  canChangeType: true,
  showFilters: true,
  showSearch: true,
  defaultActiveOnly: false,
  paginated: true,
  pageSize: 20,
  emptyStateMessage: 'Aucune adresse trouvée',
  emptyStateIcon: 'map-pin-off'
};

/**
 * Config liste par défaut pour le contexte COMPANY.
 */
export const DEFAULT_COMPANY_LIST_CONFIG: AddressListConfig = {
  context: 'company',
  displayMode: 'cards',
  showType: true,
  showLabel: true,
  showEligibilityFlags: false,
  showValidityPeriod: false,
  showVerifiedBadge: true,
  showCoordinates: false,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canSetDefault: true,
  canSetPrimary: false,
  canChangeType: true,
  showFilters: true,
  showSearch: false,
  defaultActiveOnly: true,
  paginated: false,
  pageSize: 20,
  emptyStateMessage: 'Aucune adresse enregistrée',
  emptyStateIcon: 'building-2'
};

/**
 * Config formulaire par défaut pour le contexte USER.
 */
export const DEFAULT_USER_FORM_CONFIG: AddressFormConfig = {
  context: 'user',
  allowedTypes: [
    AddressType.PRIMARY,
    AddressType.BILLING,
    AddressType.SHIPPING,
    AddressType.RESIDENTIAL,
    AddressType.PROFESSIONAL,
    AddressType.TEMPORARY,
    AddressType.OTHER
  ],
  showComplement: true,
  showStateProvince: true,
  showLabel: true,
  showNotes: true,
  showEligibilityFlags: true,
  showDefaultCheckbox: true,
  showPrimaryCheckbox: true,
  requireStateProvince: false,
  defaultCountryCode: 'BE',
  defaultType: AddressType.RESIDENTIAL,
  enableAutocomplete: false
};

/**
 * Config formulaire par défaut pour le contexte ADMIN.
 */
export const DEFAULT_ADMIN_FORM_CONFIG: AddressFormConfig = {
  context: 'admin',
  allowedTypes: Object.values(AddressType),
  showComplement: true,
  showStateProvince: true,
  showLabel: true,
  showNotes: true,
  showEligibilityFlags: true,
  showDefaultCheckbox: true,
  showPrimaryCheckbox: true,
  requireStateProvince: false,
  defaultCountryCode: 'BE',
  defaultType: AddressType.RESIDENTIAL,
  enableAutocomplete: false
};

/**
 * Config card par défaut.
 */
export const DEFAULT_CARD_CONFIG: AddressCardConfig = {
  showFullAddress: true,
  showType: true,
  showBadges: true,
  showActions: true,
  actions: ['edit', 'delete', 'setDefault', 'setPrimary'],
  compact: false,
  clickable: true
};

/**
 * Config card compacte (pour sélection dans un formulaire par exemple).
 */
export const COMPACT_CARD_CONFIG: AddressCardConfig = {
  showFullAddress: false,
  showType: true,
  showBadges: true,
  showActions: false,
  actions: [],
  compact: true,
  clickable: true
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Récupère la config liste par défaut pour un contexte.
 */
export function getDefaultListConfig(context: AddressContext): AddressListConfig {
  switch (context) {
    case 'admin': return { ...DEFAULT_ADMIN_LIST_CONFIG };
    case 'company': return { ...DEFAULT_COMPANY_LIST_CONFIG };
    case 'user':
    default: return { ...DEFAULT_USER_LIST_CONFIG };
  }
}

/**
 * Récupère la config formulaire par défaut pour un contexte.
 */
export function getDefaultFormConfig(context: AddressContext): AddressFormConfig {
  switch (context) {
    case 'admin': return { ...DEFAULT_ADMIN_FORM_CONFIG };
    case 'company':
    case 'user':
    default: return { ...DEFAULT_USER_FORM_CONFIG };
  }
}

/**
 * Merge une config partielle avec les valeurs par défaut.
 */
export function mergeListConfig(
  partial: Partial<AddressListConfig>,
  context: AddressContext = 'user'
): AddressListConfig {
  return { ...getDefaultListConfig(context), ...partial };
}

/**
 * Merge une config formulaire partielle avec les valeurs par défaut.
 */
export function mergeFormConfig(
  partial: Partial<AddressFormConfig>,
  context: AddressContext = 'user'
): AddressFormConfig {
  return { ...getDefaultFormConfig(context), ...partial };
}
