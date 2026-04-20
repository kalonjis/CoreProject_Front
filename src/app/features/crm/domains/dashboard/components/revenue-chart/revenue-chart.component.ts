import { Component, Input, signal, computed } from '@angular/core';
import { RevenueMonth } from '../../models/crm-stats.model';

/** Internal SVG coordinate point enriched with revenue data. */
interface ChartPoint {
  x:        number;
  y:        number;
  month:    string;   // ISO "2025-04"
  label:    string;   // "avr. 25"
  revenue:  number;
  dealsWon: number;
}

/** State for the hover tooltip displayed above a chart data point. */
interface Tooltip {
  x:        number;
  y:        number;
  label:    string;
  revenue:  number;
  dealsWon: number;
}

@Component({
  selector:    'app-revenue-chart',
  standalone:  true,
  templateUrl: './revenue-chart.component.html',
  styleUrl:    './revenue-chart.component.scss'
})
/**
 * SVG area chart displaying monthly CRM revenue history.
 * Renders a cubic bezier line, gradient fill, gridlines, X-axis labels, and interactive hover tooltips.
 */
export class RevenueChartComponent {

  @Input() set data(value: RevenueMonth[]) { this._data.set(value); }

  private readonly _data = signal<RevenueMonth[]>([]);
  readonly tooltip        = signal<Tooltip | null>(null);

  // ── SVG internal coordinate system ─────────────────────────────────────────
  readonly W    = 560;
  readonly H    = 190;
  readonly padL = 50;
  readonly padR = 16;
  readonly padT = 18;
  readonly padB = 36;

  get chartW()      { return this.W - this.padL - this.padR; }
  get chartH()      { return this.H - this.padT - this.padB; }
  get chartBottom() { return this.padT + this.chartH; }

  // ── Computed ────────────────────────────────────────────────────────────────

  readonly points = computed((): ChartPoint[] => {
    const data = this._data();
    if (data.length < 2) return [];
    const safeMax = this.niceMax(Math.max(...data.map(d => d.revenue)));
    const n = data.length;

    return data.map((d, i) => ({
      x:        this.padL + (i / (n - 1)) * this.chartW,
      y:        this.padT + (1 - d.revenue / safeMax) * this.chartH,
      month:    d.month,
      label:    this.monthLabel(d.month),
      revenue:  d.revenue,
      dealsWon: d.dealsWon
    }));
  });

  readonly gridlines = computed(() => {
    const max = this.niceMax(Math.max(...(this._data().map(d => d.revenue)), 0));
    return [1, 0.75, 0.5, 0.25, 0].map(ratio => ({
      y:     this.padT + (1 - ratio) * this.chartH,
      label: this.formatY(max * ratio)
    }));
  });

  readonly linePath = computed(() => this.buildLine(this.points()));

  readonly areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const line = this.buildLine(pts);
    return `${line} L ${pts.at(-1)!.x},${this.chartBottom} L ${pts[0].x},${this.chartBottom} Z`;
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private buildLine(pts: ChartPoint[]): string {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const dx = (p1.x - p0.x) / 3;
      d += ` C ${p0.x + dx},${p0.y} ${p1.x - dx},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  }

  private niceMax(value: number): number {
    if (value <= 0) return 1000;
    const mag = Math.pow(10, Math.floor(Math.log10(value)));
    return Math.ceil(value / mag) * mag;
  }

  private monthLabel(iso: string): string {
    const [year, mon] = iso.split('-');
    const names = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
                   'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.'];
    return `${names[parseInt(mon, 10) - 1]} ${year.slice(2)}`;
  }

  private formatY(value: number): string {
    if (value === 0) return '0';
    if (value >= 1000) return `${(value / 1000).toFixed(0)} k`;
    return value.toFixed(0);
  }

  formatRevenue(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' €';
  }

  showLabel(i: number, total: number): boolean {
    if (total <= 6)  return true;
    if (total <= 12) return i % 2 === 0 || i === total - 1;
    return i % 3 === 0 || i === total - 1;
  }

  // Tooltip above the dot; clamp to stay inside the viewBox
  tooltipX(x: number): number {
    const half = 54;
    return Math.min(Math.max(x, this.padL + half), this.W - this.padR - half);
  }

  tooltipY(y: number): number {
    return y > this.padT + 50 ? y - 12 : y + 56;
  }

  showTooltip(pt: ChartPoint): void {
    this.tooltip.set({ x: pt.x, y: pt.y, label: pt.label, revenue: pt.revenue, dealsWon: pt.dealsWon });
  }

  hideTooltip(): void { this.tooltip.set(null); }
}
