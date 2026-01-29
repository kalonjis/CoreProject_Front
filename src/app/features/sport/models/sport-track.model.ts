// src/app/features/sport/models/sport-track.model.ts

import { SportType } from './sport-type.model';

/**
 * Full sport track details.
 * Used for single track detail views.
 */
export interface SportTrack {
  // Identity
  publicId: string;
  gpxFilePublicId: string;

  // Metadata
  name: string;
  sportType: SportType;
  startedAt: string;  // ISO datetime
  endedAt: string;    // ISO datetime

  // Distance & Time
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationFormatted: string;
  avgSpeedMps: number;
  avgSpeedKmh: number;
  maxSpeedMps: number | null;
  maxSpeedKmh: number | null;

  // Elevation
  elevationMin: number | null;
  elevationMax: number | null;
  elevationGain: number | null;
  elevationLoss: number | null;

  // Track data
  totalTrackPoints: number;
  simplifiedTrack: TrackPoint[];
  elevationProfile: ElevationPoint[];

  // Bounding box
  boundsMinLat: number | null;
  boundsMaxLat: number | null;
  boundsMinLon: number | null;
  boundsMaxLon: number | null;
  boundsCenter: [number, number] | null;  // [lat, lon]

  // Audit
  createdAt: string;
}

/**
 * Track point: [latitude, longitude, elevation]
 */
export type TrackPoint = [number, number, number];

/**
 * Elevation profile point: [distanceKm, elevation]
 */
export type ElevationPoint = [number, number];

/**
 * Summary for list views.
 * Lightweight version without track/elevation data.
 */
export interface SportTrackSummary {
  publicId: string;
  name: string;
  sportType: SportType;
  startedAt: string;
  distanceKm: number;
  durationSeconds: number;
  durationFormatted: string;
  avgSpeedKmh: number;
  elevationGain: number | null;
  createdAt: string;
}
