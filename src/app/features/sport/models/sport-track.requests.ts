// src/app/features/sport/models/sport-track.requests.ts

import { SportType } from './sport-type.model';

/**
 * Request to import a GPX file as a sport track.
 */
export interface ImportGpxRequest {
  gpxFilePublicId: string;
  sportType?: SportType;
}

/**
 * Request to update a sport track's metadata.
 */
export interface UpdateSportTrackRequest {
  name?: string;
  sportType?: SportType;
}
