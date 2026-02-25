// src/app/features/account/components/data-export-card/data-export-card.component.ts

import { Component, OnInit, OnDestroy, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subscription, switchMap, catchError, of, finalize } from 'rxjs';

import { GdprExportApiService }    from '../../services/gdpr-export-api.service';
import { ConfirmDialogService }    from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import {
  GdprExportStatus,
  GdprExportStatusResponse,
  isPollingStatus,
  isTerminalStatus,
} from '../../models/gdpr-export.model';

/** Polling interval in milliseconds while status is PENDING or PROCESSING. */
const POLLING_INTERVAL_MS = 15_000;

/**
 * DataExportCardComponent — GDPR data export card for the Privacy page.
 *
 * Displays the current state of the user's GDPR export request
 * as an interactive stepper with 5 visual steps:
 *   Requested → Confirmed → Generating → Ready → Downloaded
 *
 * On load:  calls GET /api/privacy/export/status to restore state.
 * On click: opens a ConfirmDialog, then calls POST /api/privacy/export/request.
 * Polling:  auto-polls every 15s while status is PENDING or PROCESSING.
 * Polling stops automatically when a terminal status is reached or the
 * component is destroyed (DestroyRef / takeUntilDestroyed).
 *
 * @example
 * ```html
 * <app-data-export-card />
 * ```
 */
@Component({
  selector: 'app-data-export-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-export-card.component.html',
  styleUrl: './data-export-card.component.scss',
})
export class DataExportCardComponent implements OnInit, OnDestroy {

  private readonly gdprApi       = inject(GdprExportApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef    = inject(DestroyRef);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Full status response from the backend. Null until first load completes. */
  readonly exportStatus = signal<GdprExportStatusResponse | null>(null);

  /** True while the initial status load is in progress. */
  readonly isLoading = signal(true);

  /** True while the export request POST is in flight. */
  readonly isRequesting = signal(false);

  /** Inline error message (request failures, cooldown, etc.). */
  readonly errorMessage = signal<string | null>(null);

  /** Expose enum to the template. */
  readonly GdprExportStatus = GdprExportStatus;

  /** Active polling subscription — kept separate to allow manual stop/restart. */
  private pollingSub: Subscription | null = null;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ===========================================================================
  // PUBLIC ACTIONS
  // ===========================================================================

  /**
   * Opens a confirmation dialog, then sends the export request.
   * Starts polling once the request is accepted (202).
   */
  requestExport(): void {
    this.confirmDialog
      .confirm({
        title:             'Request data export',
        message:           'A confirmation email will be sent to your address. You will need to click the link to start the archive generation.',
        confirmButtonText: 'Send confirmation email',
        cancelButtonText:  'Cancel',
        type:              'info',
      })
      .then(() => this.sendRequest())
      .catch(() => { /* user cancelled — do nothing */ });
  }

  // ===========================================================================
  // TEMPLATE HELPERS
  // ===========================================================================

  /** Current status value, shorthand for templates. */
  get status(): GdprExportStatus | null {
    return this.exportStatus()?.status ?? null;
  }

  /**
   * Returns the active stepper step index (0-based).
   *
   * Steps:
   *   0 — Requested  (PENDING)
   *   1 — Confirmed  (PROCESSING)
   *   2 — Generating (PROCESSING — same step, spinner active)
   *   3 — Ready      (READY)
   *   4 — Downloaded (DOWNLOADED)
   */
  get activeStep(): number {
    switch (this.status) {
      case GdprExportStatus.PENDING:     return 0;
      case GdprExportStatus.PROCESSING:  return 1;
      case GdprExportStatus.READY:       return 2;
      case GdprExportStatus.DOWNLOADED:  return 3;
      default:                           return -1;
    }
  }

  /** True when the stepper should be visible (a request exists and is not EXPIRED/FAILED). */
  get showStepper(): boolean {
    return (
      this.status !== null &&
      this.status !== GdprExportStatus.EXPIRED &&
      this.status !== GdprExportStatus.FAILED
    );
  }

  /** True when the "Request export" button should be shown. */
  get showRequestButton(): boolean {
    return (
      this.status === null ||
      this.status === GdprExportStatus.DOWNLOADED ||
      this.status === GdprExportStatus.EXPIRED    ||
      this.status === GdprExportStatus.FAILED
    );
  }

  /** True when the spinner should be shown (active polling states). */
  get isPolling(): boolean {
    return isPollingStatus(this.status);
  }

  // ===========================================================================
  // PRIVATE — DATA
  // ===========================================================================

  /** Loads the current export status and starts polling if needed. */
  private loadStatus(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.gdprApi.getStatus()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
        catchError(() => {
          this.errorMessage.set('Unable to load export status. Please refresh the page.');
          return of(null);
        }),
      )
      .subscribe(res => {
        if (res) {
          this.exportStatus.set(res);
          this.handlePolling(res.status);
        }
      });
  }

  /** Sends the POST /request and updates state on success. */
  private sendRequest(): void {
    this.isRequesting.set(true);
    this.errorMessage.set(null);

    this.gdprApi.request()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isRequesting.set(false)),
        catchError(err => {
          const msg = err?.error?.message ?? err?.error?.error ?? 'An error occurred...';
          this.errorMessage.set(msg);
          return of(null);
        }),
      )
      .subscribe(res => {
        if (res !== null) {
          // Optimistically set PENDING — the next poll will confirm
          this.exportStatus.set({
            status:      GdprExportStatus.PENDING,
            requestedAt: new Date().toISOString(),
            expiresAt:   null,
            downloadReady: false,
          });
          this.startPolling();
        }
      });
  }

  // ===========================================================================
  // PRIVATE — POLLING
  // ===========================================================================

  /**
   * Starts or stops polling based on the given status.
   * Called after every status update to keep polling aligned with state.
   */
  private handlePolling(status: GdprExportStatus | null): void {
    if (isPollingStatus(status)) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  /** Starts the polling interval. Stops automatically on terminal status. */
  private startPolling(): void {
    if (this.pollingSub) return; // already polling

    this.pollingSub = interval(POLLING_INTERVAL_MS)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          this.gdprApi.getStatus().pipe(catchError(() => of(null)))
        ),
      )
      .subscribe(res => {
        if (!res) return;

        this.exportStatus.set(res);

        if (isTerminalStatus(res.status)) {
          this.stopPolling();
        }
      });
  }

  /** Cancels the active polling subscription. */
  private stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
  }
}
