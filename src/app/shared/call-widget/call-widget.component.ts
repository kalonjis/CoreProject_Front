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
 * Adapts its UI based on the active call's provider:
 *
 * SIP calls:
 *  - RINGING phase → orange dot + "Sonnerie..." + Annuler button
 *  - ACTIVE phase  → green dot + elapsed timer + Mute + Raccrocher (sends BYE via SipService)
 *  - Termination is automatic (driven by SIP.js Terminated event)
 *
 * TEL_URI calls (fallback):
 *  - Always ACTIVE phase → green dot + elapsed timer + Raccrocher
 *  - End panel: user declares ENDED (+ duration) or MISSED
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
    const s  = this._elapsedSeconds();
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  });

  // ── TEL_URI end-call panel state ──────────────────────────────────────────

  readonly showEndPanel    = signal(false);
  readonly selectedStatus  = signal<TerminalCallStatus>('ENDED');
  readonly durationSeconds = signal<number | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────

  /** True for any in-browser WebRTC provider (SIP or Twilio). */
  readonly isWebRtc   = computed(() => {
    const p = this.facade.activeCall()?.provider;
    return p === 'SIP' || p === 'TWILIO';
  });
  readonly isRinging  = this.facade.isRinging;
  readonly isMuted    = this.facade.isMuted;

  // ── Timer management ──────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      if (this.facade.activeCall()?.phase === 'ACTIVE') {
        if (this._timerId === null) {
          this._elapsedSeconds.set(0);
          this._timerId = setInterval(() => this._elapsedSeconds.update(v => v + 1), 1000);
        }
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

  /** SIP / Twilio: sends BYE / disconnects via the active service — no manual panel needed. */
  hangupWebRtc(): void {
    this.facade.hangup();
  }

  toggleMute(): void {
    this.facade.toggleMute();
  }

  /** TEL_URI: freezes the timer and opens the manual end-call panel. */
  openEndPanel(): void {
    this._stopTimer();
    this.durationSeconds.set(this._elapsedSeconds());
    this.selectedStatus.set('ENDED');
    this.showEndPanel.set(true);
  }

  confirmEnd(): void {
    const status = this.selectedStatus();
    const dur    = status === 'ENDED' ? (this.durationSeconds() ?? undefined) : undefined;
    this.facade.terminate(status, dur);
    this.showEndPanel.set(false);
  }

  cancelEnd(): void {
    this.showEndPanel.set(false);
    if (this.facade.activeCall()?.phase === 'ACTIVE' && this._timerId === null) {
      this._timerId = setInterval(() => this._elapsedSeconds.update(v => v + 1), 1000);
    }
  }
}
