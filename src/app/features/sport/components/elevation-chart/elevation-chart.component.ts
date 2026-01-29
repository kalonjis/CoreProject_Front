// src/app/features/sport/components/elevation-chart/elevation-chart.component.ts

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
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { ElevationPoint } from '../../models/sport-track.model';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Elevation profile chart component using Chart.js.
 *
 * Displays elevation (m) vs distance (km) as an area chart.
 *
 * @example
 * ```html
 * <app-elevation-chart
 *   [profile]="track.elevationProfile"
 *   [height]="200" />
 * ```
 */
@Component({
  selector: 'app-elevation-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="elevation-chart" [style.height.px]="height()">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .elevation-chart {
      width: 100%;
      position: relative;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class ElevationChartComponent implements AfterViewInit, OnDestroy, OnChanges {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** Elevation profile: [distanceKm, elevation][] */
  profile = input.required<ElevationPoint[]>();

  /** Chart height in pixels */
  height = input<number>(200);

  /** Fill color */
  fillColor = input<string>('rgba(59, 130, 246, 0.3)');

  /** Line color */
  lineColor = input<string>('#3b82f6');

  // ===========================================================================
  // PRIVATE
  // ===========================================================================

  private chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart: Chart | null = null;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile'] && !changes['profile'].firstChange) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  // ===========================================================================
  // CHART
  // ===========================================================================

  private createChart(): void {
    const ctx = this.chartCanvas().nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.getChartData();

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Altitude',
          data: data.values,
          fill: true,
          backgroundColor: this.fillColor(),
          borderColor: this.lineColor(),
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 10,
            displayColors: false,
            callbacks: {
              title: (items) => `${items[0].label} km`,
              label: (item) => `Altitude: ${item.raw} m`
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Distance (km)',
              font: { size: 11 }
            },
            grid: {
              display: false
            },
            ticks: {
              font: { size: 10 },
              maxTicksLimit: 10
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Altitude (m)',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 10 }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) {
      this.createChart();
      return;
    }

    const data = this.getChartData();
    this.chart.data.labels = data.labels;
    this.chart.data.datasets[0].data = data.values;
    this.chart.update();
  }

  private getChartData(): { labels: string[]; values: number[] } {
    const profile = this.profile();

    if (!profile || profile.length === 0) {
      return { labels: [], values: [] };
    }

    // Sample data if too many points (for performance)
    const maxPoints = 200;
    const step = Math.ceil(profile.length / maxPoints);
    const sampled = profile.filter((_, i) => i % step === 0);

    return {
      labels: sampled.map(([dist]) => dist.toFixed(2)),
      values: sampled.map(([, elev]) => Math.round(elev))
    };
  }
}
