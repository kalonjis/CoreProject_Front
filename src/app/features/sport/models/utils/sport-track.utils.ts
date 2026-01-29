// src/app/features/sport/utils/sport-track.utils.ts

/**
 * Formats distance for display.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(2)} km`;
}

/**
 * Formats speed for display.
 * - Cycling: km/h
 * - Running/Walking: pace (min/km)
 */
export function formatSpeed(kmh: number, isCycling: boolean): string {
  if (isCycling) {
    return `${kmh.toFixed(1)} km/h`;
  }

  // Convert to pace (min/km)
  if (kmh <= 0) return '-';
  const paceMinKm = 60 / kmh;
  const mins = Math.floor(paceMinKm);
  const secs = Math.round((paceMinKm - mins) * 60);
  return `${mins}'${secs.toString().padStart(2, '0')}" /km`;
}

/**
 * Formats elevation for display.
 */
export function formatElevation(meters: number | null): string {
  if (meters === null) return '-';
  return `${Math.round(meters)} m`;
}

/**
 * Formats date for display (long format).
 * Example: "jeudi 13 novembre 2025"
 */
export function formatTrackDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formats date for display (short format).
 * Example: "13 nov. 2025"
 */
export function formatTrackDateShort(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats time for display.
 * Example: "14:30"
 */
export function formatTrackTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('fr-BE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formats duration from seconds.
 * Example: "1h 23min" or "45min"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  }
  return `${minutes}min`;
}
