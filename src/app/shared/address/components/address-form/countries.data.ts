// src/app/shared/address/components/address-form/countries.data.ts

export interface Country {
  code: string;
  name: string;
}

/**
 * Liste des pays (ISO 3166-1 alpha-2).
 * Les pays les plus courants sont en premier pour faciliter la sélection.
 */
export const COUNTRIES: Country[] = [
  // Pays prioritaires (Europe de l'Ouest)
  { code: 'BE', name: 'Belgique' },
  { code: 'FR', name: 'France' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'CH', name: 'Suisse' },

  // Séparateur visuel (pays avec code spécial)
  { code: '--', name: '──────────────' },

  // Reste de l'Europe (alphabétique)
  { code: 'AT', name: 'Autriche' },
  { code: 'DK', name: 'Danemark' },
  { code: 'ES', name: 'Espagne' },
  { code: 'FI', name: 'Finlande' },
  { code: 'GR', name: 'Grèce' },
  { code: 'IE', name: 'Irlande' },
  { code: 'IT', name: 'Italie' },
  { code: 'NO', name: 'Norvège' },
  { code: 'PL', name: 'Pologne' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SE', name: 'Suède' },

  // Autre séparateur
  { code: '---', name: '──────────────' },

  // Autres pays (alphabétique)
  { code: 'AD', name: 'Andorre' },
  { code: 'AL', name: 'Albanie' },
  { code: 'AM', name: 'Arménie' },
  { code: 'AU', name: 'Australie' },
  { code: 'AZ', name: 'Azerbaïdjan' },
  { code: 'BA', name: 'Bosnie-Herzégovine' },
  { code: 'BG', name: 'Bulgarie' },
  { code: 'BR', name: 'Brésil' },
  { code: 'BY', name: 'Biélorussie' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'Chine' },
  { code: 'CY', name: 'Chypre' },
  { code: 'CZ', name: 'République tchèque' },
  { code: 'EE', name: 'Estonie' },
  { code: 'GE', name: 'Géorgie' },
  { code: 'HR', name: 'Croatie' },
  { code: 'HU', name: 'Hongrie' },
  { code: 'IL', name: 'Israël' },
  { code: 'IN', name: 'Inde' },
  { code: 'IS', name: 'Islande' },
  { code: 'JP', name: 'Japon' },
  { code: 'KR', name: 'Corée du Sud' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lituanie' },
  { code: 'LV', name: 'Lettonie' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MD', name: 'Moldavie' },
  { code: 'ME', name: 'Monténégro' },
  { code: 'MK', name: 'Macédoine du Nord' },
  { code: 'MT', name: 'Malte' },
  { code: 'MX', name: 'Mexique' },
  { code: 'NZ', name: 'Nouvelle-Zélande' },
  { code: 'RO', name: 'Roumanie' },
  { code: 'RS', name: 'Serbie' },
  { code: 'RU', name: 'Russie' },
  { code: 'SI', name: 'Slovénie' },
  { code: 'SK', name: 'Slovaquie' },
  { code: 'SM', name: 'Saint-Marin' },
  { code: 'TR', name: 'Turquie' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'US', name: 'États-Unis' },
  { code: 'VA', name: 'Vatican' },
  { code: 'XK', name: 'Kosovo' },
  { code: 'ZA', name: 'Afrique du Sud' }
];

/**
 * Récupère le nom d'un pays par son code.
 */
export function getCountryName(code: string): string {
  const country = COUNTRIES.find(c => c.code === code);
  return country?.name ?? code;
}

/**
 * Vérifie si un code pays est valide.
 */
export function isValidCountryCode(code: string): boolean {
  return COUNTRIES.some(c => c.code === code && !c.code.startsWith('-'));
}
