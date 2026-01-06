// src/app/shared/address/models/address-type.enum.ts

/**
 * Types d'adresses supportés par le système.
 * Miroir de l'enum Java : be.steby.CoreProject.dl.enums.AddressType
 */
export enum AddressType {
  PRIMARY = 'PRIMARY',
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
  RESIDENTIAL = 'RESIDENTIAL',
  PROFESSIONAL = 'PROFESSIONAL',
  TEMPORARY = 'TEMPORARY',
  LEGAL = 'LEGAL',
  WAREHOUSE = 'WAREHOUSE',
  RETURN = 'RETURN',
  OTHER = 'OTHER'
}

/**
 * Labels d'affichage pour chaque type d'adresse.
 */
export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  [AddressType.PRIMARY]: 'Principale',
  [AddressType.BILLING]: 'Facturation',
  [AddressType.SHIPPING]: 'Livraison',
  [AddressType.RESIDENTIAL]: 'Résidentielle',
  [AddressType.PROFESSIONAL]: 'Professionnelle',
  [AddressType.TEMPORARY]: 'Temporaire',
  [AddressType.LEGAL]: 'Légale',
  [AddressType.WAREHOUSE]: 'Entrepôt',
  [AddressType.RETURN]: 'Retour',
  [AddressType.OTHER]: 'Autre'
};

/**
 * Icônes pour chaque type (Lucide icons ou autre).
 */
export const ADDRESS_TYPE_ICONS: Record<AddressType, string> = {
  [AddressType.PRIMARY]: 'home',
  [AddressType.BILLING]: 'credit-card',
  [AddressType.SHIPPING]: 'truck',
  [AddressType.RESIDENTIAL]: 'house',
  [AddressType.PROFESSIONAL]: 'briefcase',
  [AddressType.TEMPORARY]: 'clock',
  [AddressType.LEGAL]: 'scale',
  [AddressType.WAREHOUSE]: 'warehouse',
  [AddressType.RETURN]: 'undo-2',
  [AddressType.OTHER]: 'map-pin'
};

/**
 * Contextes d'utilisation des adresses.
 */
export type AddressContext = 'user' | 'company' | 'admin';

/**
 * Types d'adresses pertinents par contexte.
 */
export const ADDRESS_TYPES_BY_CONTEXT: Record<AddressContext, AddressType[]> = {
  user: [
    AddressType.PRIMARY,
    AddressType.BILLING,
    AddressType.SHIPPING,
    AddressType.RESIDENTIAL,
    AddressType.PROFESSIONAL,
    AddressType.TEMPORARY,
    AddressType.OTHER
  ],
  company: [
    AddressType.PRIMARY,
    AddressType.BILLING,
    AddressType.SHIPPING,
    AddressType.LEGAL,
    AddressType.WAREHOUSE,
    AddressType.RETURN,
    AddressType.OTHER
  ],
  admin: Object.values(AddressType) // Admin voit tout
};

/**
 * Helper : récupère le label d'un type.
 */
export function getAddressTypeLabel(type: AddressType): string {
  return ADDRESS_TYPE_LABELS[type] ?? type;
}

/**
 * Helper : récupère l'icône d'un type.
 */
export function getAddressTypeIcon(type: AddressType): string {
  return ADDRESS_TYPE_ICONS[type] ?? 'map-pin';
}

/**
 * Helper : récupère les types disponibles pour un contexte.
 */
export function getAddressTypesForContext(context: AddressContext): AddressType[] {
  return ADDRESS_TYPES_BY_CONTEXT[context];
}

/**
 * Helper : génère les options pour un select/dropdown.
 */
export function getAddressTypeOptions(context?: AddressContext): Array<{ value: AddressType; label: string; icon: string }> {
  const types = context ? ADDRESS_TYPES_BY_CONTEXT[context] : Object.values(AddressType);

  return types.map(type => ({
    value: type,
    label: ADDRESS_TYPE_LABELS[type],
    icon: ADDRESS_TYPE_ICONS[type]
  }));
}
