// src/app/shared/address/models/address.model.ts

import { AddressType } from './address-type.enum';

/**
 * Données géographiques pures d'une adresse.
 * Miroir de AddressDTO côté backend.
 */
export interface Address {
  publicId: string;
  streetNumber: string | null;
  streetName: string | null;
  complement: string | null;
  postalCode: string | null;
  city: string | null;
  stateProvince: string | null;
  countryCode: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  validated: boolean;
}

/**
 * Lien abstrait entre une adresse et une entité (user, company, etc.).
 * Contient les métadonnées communes à tous les types de liens.
 * Miroir de AddressLink côté backend.
 */
export interface AddressLink {
  publicId: string;
  address: Address;
  addressType: AddressType;
  label: string | null;
  notes: string | null;
  isDefault: boolean;
  active: boolean;
  verifiedByOwner: boolean;
  validFrom: string | null;  // ISO datetime
  validTo: string | null;    // ISO datetime
  createdAt: string;         // ISO datetime
}

/**
 * Lien adresse ↔ utilisateur avec métadonnées spécifiques.
 * Miroir de UserAddressDTO côté backend.
 */
export interface UserAddress extends AddressLink {
  isPrimary: boolean;
  billingEligible: boolean;
  shippingEligible: boolean;
}

/**
 * Lien adresse ↔ company (préparation future).
 * À compléter quand CompanyAddress sera implémenté côté backend.
 */
export interface CompanyAddress extends AddressLink {
  // Champs spécifiques company à ajouter
  isHeadquarters?: boolean;
}

/**
 * Type union pour tous les types d'adresses liées.
 */
export type AnyAddressLink = UserAddress | CompanyAddress;

/**
 * Helper : vérifie si une adresse est actuellement valide.
 */
export function isAddressCurrentlyValid(link: AddressLink): boolean {
  if (!link.active) return false;

  const now = new Date();

  if (link.validFrom) {
    const from = new Date(link.validFrom);
    if (now < from) return false;
  }

  if (link.validTo) {
    const to = new Date(link.validTo);
    if (now > to) return false;
  }

  return true;
}

/**
 * Helper : vérifie si c'est une UserAddress.
 */
export function isUserAddress(link: AddressLink): link is UserAddress {
  return 'isPrimary' in link && 'billingEligible' in link;
}

/**
 * Helper : vérifie si c'est une CompanyAddress.
 */
export function isCompanyAddress(link: AddressLink): link is CompanyAddress {
  return 'isHeadquarters' in link;
}

/**
 * Helper : génère un nom d'affichage pour l'adresse.
 */
export function getAddressDisplayName(link: AddressLink): string {
  if (link.label?.trim()) {
    return link.label;
  }

  const typeName = link.addressType.toLowerCase().replace('_', ' ');

  if (isUserAddress(link) && link.isPrimary) {
    return `Adresse principale`;
  }

  if (link.isDefault) {
    return `${typeName} (par défaut)`;
  }

  return typeName.charAt(0).toUpperCase() + typeName.slice(1);
}

/**
 * Helper : formate une adresse sur une ligne.
 */
export function formatAddressOneLine(address: Address): string {
  const parts: string[] = [];

  if (address.streetNumber || address.streetName) {
    parts.push([address.streetNumber, address.streetName].filter(Boolean).join(' '));
  }

  if (address.postalCode || address.city) {
    parts.push([address.postalCode, address.city].filter(Boolean).join(' '));
  }

  if (address.countryCode) {
    parts.push(address.countryCode);
  }

  return parts.join(', ') || 'Adresse incomplète';
}

/**
 * Helper : formate une adresse sur plusieurs lignes.
 */
export function formatAddressMultiLine(address: Address): string[] {
  const lines: string[] = [];

  if (address.streetNumber || address.streetName) {
    lines.push([address.streetNumber, address.streetName].filter(Boolean).join(' '));
  }

  if (address.complement) {
    lines.push(address.complement);
  }

  if (address.postalCode || address.city) {
    lines.push([address.postalCode, address.city].filter(Boolean).join(' '));
  }

  if (address.stateProvince) {
    lines.push(address.stateProvince);
  }

  if (address.countryCode) {
    lines.push(address.countryCode);
  }

  return lines.length > 0 ? lines : ['Adresse incomplète'];
}
