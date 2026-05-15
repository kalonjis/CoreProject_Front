import {
  Component, inject, signal, computed,
  OnDestroy, effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CallFacade } from '../../core/telephony/services/call.facade';
import { TerminalCallStatus } from '../../core/telephony/models/call-session.model';

/**
 * Floating overlay shown while a call session is active.
 *
 * Displays:
 * - The phone number being called
 * - An elapsed-time counter (ticking every second)
 * - A button to open the end-call panel
 *
 * End-call panel lets the user declare:
 * - ENDED (answered) with an optional duration in seconds
 * - MISSED (no answer) — duration not required
 *
 * The widget is mounted once in {@link CrmShellComponent} and reacts
 * reactively to the {@link CallStore} signals via {@link CallFacade}.
 */
@Component({
  selector: 'app-call-widget',
  imports: [FormsModule],
  templateUrl: './call-widget.component.html',
  styleUrl: './call-widget.component.scss'
})
export class CallWidgetComponent implements OnDestroy {

  readonly facade = inject(CallFacade);

  // ── Timer ─────────────────────────────────────────────────────────────────

  private readonly _elapsedSeconds = signal(0);
  private _timerId: ReturnType<typeof setInterval> | null = null;

  readonly elapsedLabel = computed(() => {
    const s = this._elapsedSeconds();
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  });

  // ── End-call panel state ──────────────────────────────────────────────────

  readonly showEndPanel     = signal(false);
  readonly selectedStatus   = signal<TerminalCallStatus>('ENDED');
  readonly durationSeconds  = signal<number | null>(null);

  // ── Timer management ──────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      if (this.facade.isCallActive()) {
        this._elapsedSeconds.set(0);
        this._timerId = setInterval(() => this._elapsedSeconds.update(v => v + 1), 1000);
      } else {
        this._stopTimer();
      }
    });
  }

  ngOnDestroy(): void {
    this._stopTimer();
  }

  private _stopTimer(): void {
    if (this._timerId !== null) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  openEndPanel(): void {
    this.showEndPanel.set(true);
    this.selectedStatus.set('ENDED');
    this.durationSeconds.set(this._elapsedSeconds());
  }

  confirmEnd(): void {
    const status = this.selectedStatus();
    const dur    = status === 'ENDED' ? (this.durationSeconds() ?? undefined) : undefined;
    this.facade.terminate(status, dur);
    this.showEndPanel.set(false);
  }

  cancelEnd(): void {
    this.showEndPanel.set(false);
  }
}
