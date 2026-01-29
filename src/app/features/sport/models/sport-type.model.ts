// src/app/features/sport/models/sport-type.model.ts

/**
 * Supported sport types.
 * Matches backend SportType enum.
 */
export type SportType =
  | 'MTB'
  | 'CYCLING'
  | 'RUNNING'
  | 'TRAIL_RUNNING'
  | 'HIKING'
  | 'WALKING'
  | 'OTHER';

/**
 * Sport type metadata for display.
 */
export interface SportTypeInfo {
  value: SportType;
  displayName: string;
  icon: string;
  isCycling: boolean;
}

/**
 * All sport types with display info.
 */
export const SPORT_TYPES: SportTypeInfo[] = [
  { value: 'MTB', displayName: 'VTT', icon: '🚵', isCycling: true },
  { value: 'CYCLING', displayName: 'Vélo', icon: '🚴', isCycling: true },
  { value: 'RUNNING', displayName: 'Course', icon: '🏃', isCycling: false },
  { value: 'TRAIL_RUNNING', displayName: 'Trail', icon: '🏔️', isCycling: false },
  { value: 'HIKING', displayName: 'Randonnée', icon: '🥾', isCycling: false },
  { value: 'WALKING', displayName: 'Marche', icon: '🚶', isCycling: false },
  { value: 'OTHER', displayName: 'Autre', icon: '🏅', isCycling: false },
];

/**
 * Gets display info for a sport type.
 */
export function getSportTypeInfo(type: SportType): SportTypeInfo {
  return SPORT_TYPES.find(t => t.value === type) ?? SPORT_TYPES[SPORT_TYPES.length - 1];
}
