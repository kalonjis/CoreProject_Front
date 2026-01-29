// src/app/features/sport/models/owner-stats.model.ts

/**
 * Aggregated statistics for a track owner.
 */
export interface OwnerStats {
  totalTracks: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  totalDurationHours: number;
  totalDurationFormatted: string;
  totalElevationGainM: number;
}
