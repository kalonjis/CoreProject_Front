// src/app/shared/address/models/address-request.model.ts

import { AddressType } from './address-type.enum';

/**
 * Requête de création d'une adresse utilisateur.
 * Miroir de CreateUserAddressRequest côté backend.
 */
export interface CreateAddressRequest {
  // Données géographiques
  streetNumber?: string | null;
  streetName: string;
  complement?: string | null;
  postalCode: string;
  city: string;
  stateProvince?: string | null;
  countryCode: string;

  // Métadonnées du lien
  addressType: AddressType;
  label?: string | null;
  notes?: string | null;
  isDefault?: boolean;
  isPrimary?: boolean;

  // Éligibilité (UserAddress spécifique)
  billingEligible?: boolean;
  shippingEligible?: boolean;
}

/**
 * Requête de mise à jour d'une adresse.
 * Tous les champs sont optionnels (PATCH semantics).
 * Miroir de UpdateUserAddressRequest côté backend.
 */
export interface UpdateAddressRequest {
  // Données géographiques (optionnelles)
  streetNumber?: string | null;
  streetName?: string | null;
  complement?: string | null;
  postalCode?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  countryCode?: string | null;

  // Métadonnées du lien (optionnelles)
  label?: string | null;
  notes?: string | null;

  // Éligibilité (optionnelle)
  billingEligible?: boolean;
  shippingEligible?: boolean;
}

/**
 * Critères de recherche/filtrage des adresses.
 * Miroir de UserAddressSearchCriteria côté backend.
 */
export interface AddressSearchCriteria {
  type?: AddressType;
  active?: boolean;
  isDefault?: boolean;
  isPrimary?: boolean;
  billingEligible?: boolean;
  shippingEligible?: boolean;
  verified?: boolean;
  countryCode?: string;
  city?: string;
  postalCode?: string;
  label?: string;
  validOnly?: boolean;
  hasCoordinates?: boolean;
}

/**
 * Requête pour changer le type d'une adresse.
 */
export interface ChangeAddressTypeRequest {
  newType: AddressType;
  setAsDefault?: boolean;
}

/**
 * Réponse générique pour les opérations sur les adresses.
 */
export interface AddressOperationResponse {
  message: string;
  operation: string;
  publicId?: string;
}

/**
 * Helper : construit les query params depuis les critères de recherche.
 */
export function buildSearchParams(criteria: AddressSearchCriteria): Record<string, string> {
  const params: Record<string, string> = {};

  if (criteria.type !== undefined) params['type'] = criteria.type;
  if (criteria.active !== undefined) params['active'] = String(criteria.active);
  if (criteria.isDefault !== undefined) params['isDefault'] = String(criteria.isDefault);
  if (criteria.isPrimary !== undefined) params['isPrimary'] = String(criteria.isPrimary);
  if (criteria.billingEligible !== undefined) params['billingEligible'] = String(criteria.billingEligible);
  if (criteria.shippingEligible !== undefined) params['shippingEligible'] = String(criteria.shippingEligible);
  if (criteria.verified !== undefined) params['verified'] = String(criteria.verified);
  if (criteria.countryCode) params['countryCode'] = criteria.countryCode;
  if (criteria.city) params['city'] = criteria.city;
  if (criteria.postalCode) params['postalCode'] = criteria.postalCode;
  if (criteria.label) params['label'] = criteria.label;
  if (criteria.validOnly !== undefined) params['validOnly'] = String(criteria.validOnly);
  if (criteria.hasCoordinates !== undefined) params['hasCoordinates'] = String(criteria.hasCoordinates);

  return params;
}

/**
 * Helper : vérifie si des critères de recherche sont définis.
 */
export function hasSearchCriteria(criteria: AddressSearchCriteria | null | undefined): boolean {
  if (!criteria) return false;
  return Object.values(criteria).some(v => v !== undefined && v !== null && v !== '');
}

/**
 * Factory : crée une requête de création avec des valeurs par défaut.
 */
export function createDefaultAddressRequest(type: AddressType = AddressType.RESIDENTIAL): Partial<CreateAddressRequest> {
  return {
    addressType: type,
    isDefault: false,
    isPrimary: false,
    billingEligible: true,
    shippingEligible: true
  };
}
