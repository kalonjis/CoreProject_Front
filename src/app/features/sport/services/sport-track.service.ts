// src/app/features/sport/services/sport-track.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

import { Page } from '../../../shared/models/page.model';
import { SportType } from '../models/sport-type.model';
import { SportTrack, SportTrackSummary } from '../models/sport-track.model';
import { OwnerStats } from '../models/owner-stats.model';
import { ImportGpxRequest, UpdateSportTrackRequest } from '../models/sport-track.requests';

/**
 * Service for sport track API operations.
 *
 * Handles all CRUD operations and maintains local state cache.
 */
@Injectable({
  providedIn: 'root'
})
export class SportTrackService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `/api/sport-tracks`;

  // ===========================================================================
  // LOCAL STATE (simple cache)
  // ===========================================================================

  private readonly tracksSubject = new BehaviorSubject<SportTrackSummary[]>([]);
  private readonly statsSubject = new BehaviorSubject<OwnerStats | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  /** Observable list of tracks (for reactive updates) */
  readonly tracks$ = this.tracksSubject.asObservable();

  /** Observable stats */
  readonly stats$ = this.statsSubject.asObservable();

  /** Loading state */
  readonly loading$ = this.loadingSubject.asObservable();

  // ===========================================================================
  // IMPORT
  // ===========================================================================

  /**
   * Imports a GPX file and creates a new sport track.
   *
   * @param gpxFilePublicId - Public ID of the uploaded GPX file
   * @param sportType - Type of sport activity (optional)
   * @returns The created sport track
   */
  import(gpxFilePublicId: string, sportType?: SportType): Observable<SportTrack> {
    const request: ImportGpxRequest = { gpxFilePublicId, sportType };

    return this.http.post<SportTrack>(`${this.baseUrl}/import`, request).pipe(
      tap(track => {
        // Add to local cache
        const summary = this.trackToSummary(track);
        const current = this.tracksSubject.value;
        this.tracksSubject.next([summary, ...current]);

        // Invalidate stats (will be refreshed on next load)
        this.statsSubject.next(null);
      })
    );
  }

  // ===========================================================================
  // READ
  // ===========================================================================

  /**
   * Gets a single sport track by public ID.
   */
  getByPublicId(publicId: string): Observable<SportTrack> {
    return this.http.get<SportTrack>(`${this.baseUrl}/${publicId}`);
  }

  /**
   * Lists sport tracks with pagination and optional filtering.
   *
   * @param page - Page number (0-indexed)
   * @param size - Page size
   * @param sportType - Optional filter by sport type
   */
  list(page = 0, size = 20, sportType?: SportType): Observable<Page<SportTrackSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'startedAt,desc');

    if (sportType) {
      params = params.set('sportType', sportType);
    }

    this.loadingSubject.next(true);

    return this.http.get<Page<SportTrackSummary>>(this.baseUrl, { params }).pipe(
      tap(response => {
        if (page === 0) {
          // First page: replace cache
          this.tracksSubject.next(response.content);
        } else {
          // Subsequent pages: append
          const current = this.tracksSubject.value;
          this.tracksSubject.next([...current, ...response.content]);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Gets aggregated statistics.
   */
  getStats(): Observable<OwnerStats> {
    return this.http.get<OwnerStats>(`${this.baseUrl}/stats`).pipe(
      tap(stats => this.statsSubject.next(stats))
    );
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  /**
   * Updates a sport track's metadata.
   */
  update(publicId: string, request: UpdateSportTrackRequest): Observable<SportTrack> {
    return this.http.patch<SportTrack>(`${this.baseUrl}/${publicId}`, request).pipe(
      tap(track => {
        // Update in local cache
        const current = this.tracksSubject.value;
        const updated = current.map(t =>
          t.publicId === publicId ? this.trackToSummary(track) : t
        );
        this.tracksSubject.next(updated);
      })
    );
  }

  // ===========================================================================
  // DELETE
  // ===========================================================================

  /**
   * Deletes a sport track.
   */
  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${publicId}`).pipe(
      tap(() => {
        // Remove from local cache
        const current = this.tracksSubject.value;
        this.tracksSubject.next(current.filter(t => t.publicId !== publicId));

        // Invalidate stats
        this.statsSubject.next(null);
      })
    );
  }

  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================

  /**
   * Clears the local cache.
   * Useful when user logs out or switches context.
   */
  clearCache(): void {
    this.tracksSubject.next([]);
    this.statsSubject.next(null);
  }

  /**
   * Forces a refresh of the tracks list.
   */
  refresh(): Observable<Page<SportTrackSummary>> {
    this.clearCache();
    return this.list(0, 20);
  }

  // ===========================================================================
  // PRIVATE
  // ===========================================================================

  /**
   * Converts full track to summary for cache storage.
   */
  private trackToSummary(track: SportTrack): SportTrackSummary {
    return {
      publicId: track.publicId,
      name: track.name,
      sportType: track.sportType,
      startedAt: track.startedAt,
      distanceKm: track.distanceKm,
      durationSeconds: track.durationSeconds,
      durationFormatted: track.durationFormatted,
      avgSpeedKmh: track.avgSpeedKmh,
      elevationGain: track.elevationGain,
      createdAt: track.createdAt
    };
  }
}
