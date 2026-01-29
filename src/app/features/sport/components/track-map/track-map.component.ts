// src/app/features/sport/components/track-map/track-map.component.ts

import {
  Component,
  input,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

import { TrackPoint } from '../../models/sport-track.model';

/**
 * Map component displaying a sport track using Leaflet.
 *
 * Features:
 * - OpenStreetMap tiles
 * - Track polyline with customizable color
 * - Start/End markers
 * - Auto-fit bounds to track
 *
 * @example
 * ```html
 * <app-track-map
 *   [track]="track.simplifiedTrack"
 *   [boundsCenter]="track.boundsCenter"
 *   [height]="400" />
 * ```
 */
@Component({
  selector: 'app-track-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #mapContainer
      class="track-map"
      [style.height.px]="height()">
    </div>
  `,
  styles: [`
    .track-map {
      width: 100%;
      border-radius: 0.5rem;
      z-index: 0;
    }
  `]
})
export class TrackMapComponent implements AfterViewInit, OnDestroy, OnChanges {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** Track points: [lat, lon, elevation][] */
  track = input.required<TrackPoint[]>();

  /** Center point for initial view [lat, lon] */
  boundsCenter = input<[number, number] | null>(null);

  /** Map height in pixels */
  height = input<number>(400);

  /** Track line color */
  trackColor = input<string>('#3b82f6');

  /** Track line weight */
  trackWeight = input<number>(4);

  // ===========================================================================
  // PRIVATE
  // ===========================================================================

  private mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private map: L.Map | null = null;
  private trackLayer: L.Polyline | null = null;
  private markersLayer: L.LayerGroup | null = null;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngAfterViewInit(): void {
    this.initMap();
    this.drawTrack();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['track'] && !changes['track'].firstChange) {
      this.drawTrack();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // ===========================================================================
  // MAP INITIALIZATION
  // ===========================================================================

  private initMap(): void {
    const container = this.mapContainer().nativeElement;
    const center = this.boundsCenter() ?? [50.67, 4.52]; // Default: Belgium

    // Create map
    this.map = L.map(container, {
      center: center,
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    // Initialize layers
    this.markersLayer = L.layerGroup().addTo(this.map);
  }

  // ===========================================================================
  // TRACK DRAWING
  // ===========================================================================

  private drawTrack(): void {
    if (!this.map) return;

    const trackPoints = this.track();
    if (!trackPoints || trackPoints.length === 0) return;

    // Clear previous track
    if (this.trackLayer) {
      this.map.removeLayer(this.trackLayer);
    }
    if (this.markersLayer) {
      this.markersLayer.clearLayers();
    }

    // Convert to LatLng array
    const latLngs: L.LatLngExpression[] = trackPoints.map(
      ([lat, lon]) => [lat, lon] as L.LatLngTuple
    );

    // Draw track polyline
    this.trackLayer = L.polyline(latLngs, {
      color: this.trackColor(),
      weight: this.trackWeight(),
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(this.map);

    // Add start marker
    const startIcon = this.createIcon('🟢', 'Départ');
    L.marker(latLngs[0], { icon: startIcon })
      .bindPopup('Départ')
      .addTo(this.markersLayer!);

    // Add end marker
    const endIcon = this.createIcon('🏁', 'Arrivée');
    L.marker(latLngs[latLngs.length - 1], { icon: endIcon })
      .bindPopup('Arrivée')
      .addTo(this.markersLayer!);

    // Fit map to track bounds
    const bounds = this.trackLayer.getBounds();
    this.map.fitBounds(bounds, { padding: [20, 20] });
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private createIcon(emoji: string, title: string): L.DivIcon {
    return L.divIcon({
      html: `<span style="font-size: 24px;" title="${title}">${emoji}</span>`,
      className: 'track-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }
}
